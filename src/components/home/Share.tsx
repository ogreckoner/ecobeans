import React, { useState } from "react";
import { ethers } from "ethers";
import { SendOutlined } from "@ant-design/icons";
import { Alert, Button, Input, InputProps, notification, Space, Typography } from "antd";
import isEqual from "lodash.isequal";

import Peanut from "@modules/peanut";
import { useTokenPrice } from "@hooks";
import { getSimpleAccount, useStackup } from "@contexts/StackupContext";
import { TokenFee } from "@components/commons/TokenFee";
import { blockExplorerLink, convertAmount, formatTokenAmount } from "@helpers";

import { PEANUT_V3_ADDRESS } from "@modules/peanut/constants";
import { ERC20__factory, PeanutV3__factory } from "@assets/contracts";
import { ECO_TOKEN_ADDRESS, VERIFYING_PAYMASTER_ADDRESS } from "@constants";

import { ReactComponent as EcoLogo } from "@assets/images/eco-logo.svg";
import { getTransaction } from "@helpers/contracts";

function getValues({
  amount,
  expectedGasFee,
  ecoPrice,
  balance,
}: {
  amount: string;
  // Expected Gas In ETH
  expectedGasFee: ethers.BigNumber;
  // ECO/ETH price
  ecoPrice: number;
  // Wallet's current balance
  balance?: ethers.BigNumber;
}) {
  let total: ethers.BigNumber;
  try {
    total = convertAmount(amount).abs();
  } catch (e) {
    total = ethers.constants.Zero;
  }

  const tokensFee: number = ecoPrice && (Number(expectedGasFee.toBigInt()) / 1e18) * (1 / ecoPrice);
  const exceedsBalance = total.add(ethers.utils.parseEther(tokensFee.toString())).gt(balance || ethers.constants.Zero);

  return { total, tokensFee, exceedsBalance };
}

interface TransferProps {
  balance?: ethers.BigNumber;
}

interface ShareLink {
  link: string;
  txHash: string;
  amount: ethers.BigNumber;
}

export const Share: React.FC<TransferProps> = ({ balance }) => {
  const { address, client, provider, simpleAccount } = useStackup();

  const { data: ecoPrice = 0 } = useTokenPrice("eco");

  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState<ShareLink>();

  const doSend = async () => {
    setLoading(true);
    setShareLink(undefined);
    try {
      const value = convertAmount(amount);
      const { password, transaction } = await Peanut.makeDeposit(value);

      const eco = ERC20__factory.connect(ECO_TOKEN_ADDRESS, provider);
      const peanut = PeanutV3__factory.connect(PEANUT_V3_ADDRESS, provider);

      const peanutAllowance = await eco.allowance(address, PEANUT_V3_ADDRESS);
      const paymasterAllowance = await eco.allowance(address, VERIFYING_PAYMASTER_ADDRESS);

      const txs = [transaction];

      if (peanutAllowance.lt(value)) {
        const data = ERC20__factory.createInterface().encodeFunctionData("approve", [PEANUT_V3_ADDRESS, value]);
        txs.push({ to: ECO_TOKEN_ADDRESS, data });
      }

      if (paymasterAllowance.lt(ethers.constants.WeiPerEther.mul(10_000))) {
        // If paymaster's allowance is less than 10.000 ECO tokens
        // Include token approval for paymaster to pay gas in ECO tokens
        const data = ERC20__factory.createInterface().encodeFunctionData("approve", [
          VERIFYING_PAYMASTER_ADDRESS,
          ethers.constants.MaxUint256,
        ]);
        txs.push({ to: ECO_TOKEN_ADDRESS, data });
      }

      // Reverse order of transactions to execute token approvals first
      txs.reverse();

      simpleAccount.executeBatch(
        txs.map(tx => tx.to),
        txs.map(tx => tx.data),
      );

      const res = await client.sendUserOperation(simpleAccount);
      const userOpResponse = await res.wait();

      if (!userOpResponse) {
        notification.error({ message: "Unexpected error", description: "Please contact us for help" });
        return;
      }

      const tx = await getTransaction(provider, userOpResponse.transactionHash);
      const receipt = await tx.wait();

      const evt = peanut.filters.DepositEvent(null, null, null, address);
      const depositEvt = receipt.logs.find(log => log.address === evt.address && isEqual(log.topics, evt.topics));

      if (!depositEvt) {
        notification.error({ message: "Unexpected error", description: "Please contact us for help" });
        return;
      }

      const [depositId] = peanut.interface.decodeEventLog("DepositEvent", depositEvt.data, depositEvt.topics);

      const link = Peanut.createLink(password, depositId);

      setShareLink({ link, amount: value, txHash: userOpResponse.transactionHash });

      notification.success({
        placement: "topRight",
        message: "Share link created!",
        duration: 10000,
        description: (
          <>
            You have created a link for <b>{formatTokenAmount(ethers.utils.formatEther(value), 3)} ECO</b> tokens.
            <br />
            <Typography.Link href={blockExplorerLink(userOpResponse.transactionHash)} target="_blank">
              See transaction.
            </Typography.Link>
          </>
        ),
      });

      setAmount("");
    } catch (e) {
      console.log("[share]", e);
      notification.error({
        placement: "topRight",
        message: "Share failed",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKey: InputProps["onKeyUp"] = event => {
    if (event.key === "Enter") doSend();
  };

  const expectedGasFee = ethers.constants.Zero;
  const { tokensFee, exceedsBalance } = getValues({ amount, balance, expectedGasFee, ecoPrice });
  const disabled = exceedsBalance || loading || !amount;

  return (
    <Space direction="vertical" size="large" align="center" style={{ width: "100%" }}>
      <Input
        type="number"
        size="large"
        min="0"
        pattern="\d*"
        placeholder="amount to send"
        value={amount}
        onKeyPress={handleKey}
        style={{ width: 320 }}
        onChange={e => setAmount(e.target.value)}
        prefix={<EcoLogo style={{ width: 20, height: 20 }} />}
      />

      <TokenFee fee={tokensFee} />

      {exceedsBalance && amount ? (
        <div style={{ marginTop: 8 }}>
          <span style={{ color: "rgb(200,0,0)" }}>amount + fee exceeds balance</span>{" "}
        </div>
      ) : null}
      <Button
        key="submit"
        size="large"
        type="primary"
        onClick={doSend}
        loading={loading}
        disabled={disabled}
        icon={<SendOutlined />}
      >
        {!loading ? "Share" : "Creating Link..."}
      </Button>

      {shareLink ? (
        <Alert
          message="Share link created"
          type="success"
          showIcon
          description={
            <Typography.Paragraph style={{ maxWidth: 400 }}>
              Share this link to claim <b>{formatTokenAmount(ethers.utils.formatEther(shareLink.amount), 3)} ECO</b>{" "}
              tokens.
              <pre>{shareLink.link}</pre>
            </Typography.Paragraph>
          }
        />
      ) : null}
    </Space>
  );
};
