import React, { useState } from "react";
import { ethers } from "ethers";
import { SendOutlined } from "@ant-design/icons";
import { Alert, Button, Input, InputProps, Space, Typography } from "antd";

import * as Peanut from "@modules/peanut";
import { useAlert } from "@hooks/useAlert";
import { usePeanutDeposit } from "@hooks/usePeanutDeposit";
import { blockExplorerLink, convertAmount, formatTokenAmount, getTransaction } from "@helpers";

import { TokenIcon } from "@components/token";
import { TokenFee } from "@components/commons/TokenFee";
import { useCurrentToken } from "@components/home/context/TokenContext";
import { FeeOperation, useOperationFee } from "@hooks/useOperationFee";
import { getTokenInfo } from "@constants";
import { OPTIMISM_PROVIDER } from "@modules/blockchain/providers";
import { useStackup } from "@contexts/StackupContext";

function getValues({
  amount,
  decimals,
  fee,
  balance,
}: {
  amount: string;
  decimals: number;
  fee?: ethers.BigNumber;
  // Wallet's current balance
  balance?: ethers.BigNumber;
}) {
  let total: ethers.BigNumber;
  try {
    total = convertAmount(amount, decimals).abs();
  } catch (e) {
    total = ethers.constants.Zero;
  }

  const exceedsBalance = total.add(fee || ethers.constants.Zero).gt(balance || ethers.constants.Zero);

  return { total, exceedsBalance };
}

export const Share: React.FC = () => {
  const { address } = useStackup();
  const { token: tokenId, balance } = useCurrentToken();
  const { deposit: makeDeposit } = usePeanutDeposit();
  const { data: fee } = useOperationFee(tokenId, FeeOperation.Share);

  const [alertApi, alertElemt] = useAlert({ className: "share-alert" });

  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const token = getTokenInfo(tokenId);

  const doSend = async () => {
    if (!fee || !address) return;
    setLoading(true);
    alertApi.clear();
    try {
      const value = convertAmount(amount, token.decimals);

      const password = Peanut.getRandomString();
      const userOpHash = await makeDeposit(tokenId, password, value, fee);

      if (!userOpHash) {
        alertApi.error({ message: "Unexpected error", description: "Please contact us for help" });
        return;
      }

      const tx = await getTransaction(OPTIMISM_PROVIDER, userOpHash.transactionHash);
      const receipt = await tx.wait();

      const deposit = Peanut.getDepositEvent(address, receipt);
      const link = Peanut.createLink(tokenId, password, deposit.id);

      alertApi.success({
        message: "Share link created!",
        description: (
          <>
            <Typography.Paragraph style={{ maxWidth: 400 }}>
              Share this link to claim{" "}
              <b>
                {formatTokenAmount(ethers.utils.formatUnits(value, token.decimals), 3)} {token.name}
              </b>{" "}
              tokens.
              <Typography.Link href={blockExplorerLink(userOpHash.transactionHash)} target="_blank">
                See transaction.
              </Typography.Link>
              <pre>{link}</pre>
            </Typography.Paragraph>
          </>
        ),
      });

      setAmount("");
    } catch (e) {
      console.error("[share:error]", e);
      alertApi.error({
        message: "Share failed",
        description: "Please contact us for help",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKey: InputProps["onKeyUp"] = event => {
    if (event.key === "Enter") return doSend();
  };

  const { exceedsBalance } = getValues({ amount, decimals: token.decimals, fee, balance });
  const disabled = exceedsBalance || loading || !amount;

  return (
    <Space direction="vertical" size="large" align="center" style={{ width: "100%" }}>
      <Input
        type="number"
        size="large"
        min="0"
        pattern="\d*"
        data-cy="share-input-amount"
        placeholder="amount to send"
        value={amount}
        onKeyPress={handleKey}
        style={{ width: 320 }}
        onChange={e => setAmount(e.target.value)}
        prefix={<TokenIcon token={tokenId} style={{ width: 20, height: 20 }} />}
      />

      <TokenFee token={tokenId} fee={fee} />

      {exceedsBalance && amount && !loading ? (
        <Alert
          showIcon
          type="error"
          style={{ marginTop: 8 }}
          message={<span data-cy="share-insufficient-funds">Transfer amount plus fee charge exceeds balance</span>}
        />
      ) : null}
      <Button
        data-cy="share-send-btn"
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

      {alertElemt}
    </Space>
  );
};
