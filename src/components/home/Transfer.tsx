import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BigNumber, ethers } from "ethers";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ScanOutlined, SendOutlined } from "@ant-design/icons";
import { Alert, Button, FloatButton, Input, InputProps, Space, Typography } from "antd";

import { useAlert } from "@hooks/useAlert";
import { useFunTokenTransfer } from "@hooks/useFunTokenTransfer";
import { FeeOperation, FLAT_FEE_AMOUNT, useOperationFee } from "@hooks/useOperationFee";
import { blockExplorerLink, convertAmount, formatTokenAmount } from "@helpers";

// Components
import { Address } from "@components";
import { TokenIcon } from "@components/token";
import { TokenFee } from "@components/commons/TokenFee";
import { AddressInput } from "@components/AddressInput";
import { useCurrentToken } from "@components/home/context/TokenContext";
import { getNetwork, getTokenInfo } from "@constants";

function getTotal(amount: string, decimals: number) {
  try {
    return convertAmount(amount, decimals).abs();
  } catch (e) {
    return ethers.constants.Zero;
  }
}

let scanner: (show: boolean) => void;

function calculateTransferAmounts(total: BigNumber, fee: BigNumber, balances: BigNumber[]): BigNumber[] {
  let diff = total;
  let amounts = balances.map(amount => {
    let transferAmount: BigNumber;
    if (diff.isZero()) {
      transferAmount = ethers.constants.Zero;
    } else if (amount.gte(diff)) {
      transferAmount = diff;
      diff = ethers.constants.Zero;
    } else {
      transferAmount = amount;
      diff = diff.sub(amount);
    }
    return transferAmount;
  });

  const transfersCount = amounts.filter(amount => !amount.isZero()).length;
  if (!transfersCount) return amounts;

  const feePerTransfer = fee.div(transfersCount);

  let invalidBalance = -1;
  let missingBalance = ethers.constants.Zero;

  amounts = amounts.map((amount, index) => {
    const balance = balances[index];
    if (amount.isZero()) return amount;
    if (balance.lte(fee)) {
      invalidBalance = index;
      return ethers.constants.Zero;
    }
    const transferAmount = amount.add(feePerTransfer).add(missingBalance);
    if (balance.lt(transferAmount)) {
      missingBalance = transferAmount.sub(balance);
      return balance.sub(feePerTransfer);
    }
    missingBalance = ethers.constants.Zero;
    return transferAmount;
  });

  if (invalidBalance >= 0) {
    balances = [...balances];
    balances[invalidBalance] = ethers.constants.Zero;
    return calculateTransferAmounts(total, fee, balances);
  }

  if (!missingBalance.isZero()) throw new Error("Not enough balance");

  return amounts;
}

type TransactionResult =
  | {
      hash: string;
      amount: BigNumber;
      error?: false;
    }
  | { error: true };

export const Transfer: React.FC = () => {
  const navigate = useNavigate();
  const { token: tokenId, balance, optimismBalance, baseBalance } = useCurrentToken();
  const token = getTokenInfo(tokenId);

  const { transfer: transferBase } = useFunTokenTransfer(tokenId, "base");
  const { transfer: transferOptimism } = useFunTokenTransfer(tokenId, "optimism");

  const { data: fee } = useOperationFee(tokenId, FeeOperation.Transfer);

  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [toAddress, setToAddress] = useState("");

  const [alertApi, alertElem] = useAlert({ className: "transfer-alert" });

  const [searchParams] = useSearchParams();
  useEffect(() => {
    const _address = searchParams.get("addr");
    if (_address) {
      setToAddress(_address);
      navigate("/");
    }
  }, [navigate, searchParams]);

  const doSend = async () => {
    if (!fee || !optimismBalance || !baseBalance) return;
    setLoading(true);
    alertApi.clear();
    const value = convertAmount(amount, token.decimals);
    try {
      const transferAmounts = calculateTransferAmounts(value, FLAT_FEE_AMOUNT, [optimismBalance, baseBalance]);
      console.log("transferAmounts", ...transferAmounts);
      const [optimismTransferAmount, baseTransferAmount] = transferAmounts;

      let opTx: TransactionResult = { error: true };
      let baseTx: TransactionResult = { error: true };
      let transferred = ethers.constants.Zero;

      const transferringOnBothChains = !transferAmounts.some(amount => amount.isZero());

      const fee = transferringOnBothChains ? FLAT_FEE_AMOUNT.div(2) : FLAT_FEE_AMOUNT;

      if (!optimismTransferAmount.isZero()) {
        try {
          const opTxHash = await transferOptimism(toAddress, optimismTransferAmount, fee);
          transferred = transferred.add(optimismTransferAmount);
          opTx = { hash: opTxHash, amount: optimismTransferAmount };
        } catch (e) {
          console.error("optimism-transfer-failed", e);
        }
      }
      if (!baseTransferAmount.isZero()) {
        try {
          const baseTxHash = await transferBase(toAddress, baseTransferAmount, fee);
          transferred = transferred.add(baseTransferAmount);
          baseTx = { hash: baseTxHash, amount: baseTransferAmount };
        } catch (e) {
          console.error("base-transfer-failed", e);
        }
      }

      if (opTx.error && baseTx.error) {
        alertApi.error({ message: "Transfer failed" });
        return;
      }

      const hasAnError = !transferred.eq(value);

      alertApi.show({
        type: hasAnError ? "warning" : "success",
        message: hasAnError ? "Partial Transfer Executed" : "Transfer Executed!",
        description: (
          <>
            You have sent{" "}
            <b>
              {formatTokenAmount(ethers.utils.formatUnits(transferred, token.decimals), 2)} {token.name}
            </b>{" "}
            tokens to <Address address={toAddress} style={{ fontWeight: "bold" }} />.<br />
            {!opTx.error ? (
              <Typography.Link href={blockExplorerLink(opTx.hash)} target="_blank">
                See Optimism transaction
              </Typography.Link>
            ) : null}
            {!hasAnError ? <br /> : null}
            {!baseTx.error ? (
              <Typography.Link href={blockExplorerLink(baseTx.hash, getNetwork("base"))} target="_blank">
                See Base transaction
              </Typography.Link>
            ) : null}
          </>
        ),
      });

      setAmount("");
    } catch (e) {
      console.log("[gasless:transfer]", e);
      alertApi.error({
        message: "Transfer failed",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKey: InputProps["onKeyUp"] = event => {
    if (event.key === "Enter") doSend();
  };

  const total = getTotal(amount, token.decimals);
  const exceedsBalance = total.add(fee || ethers.constants.Zero).gt(balance || ethers.constants.Zero);
  const disabled = exceedsBalance || loading || !amount || !toAddress;

  return (
    <>
      <Space direction="vertical" size="large" align="center" style={{ width: "100%" }}>
        <AddressInput
          data-cy="transfer-input-recipient"
          placeholder="to address"
          value={toAddress}
          onChange={setToAddress}
          hoistScanner={toggle => (scanner = toggle)}
        />
        <Input
          type="number"
          size="large"
          min="0"
          pattern="\d*"
          data-cy="transfer-input-amount"
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
            message={<span data-cy="transfer-insufficient-funds">Transfer amount plus fee charge exceeds balance</span>}
          />
        ) : null}
        <div
          style={{
            gap: 8,
            margin: "auto",
            display: "flex",
            alignItems: "center",
            flexDirection: "column",
          }}
        >
          <Button
            data-cy="transfer-send-btn"
            key="submit"
            size="large"
            type="primary"
            onClick={doSend}
            loading={loading}
            disabled={disabled}
            icon={<SendOutlined />}
          >
            Send
          </Button>

          {loading ? <span style={{ color: "#06153c" }}>Transferring tokens...</span> : null}
        </div>
        {alertElem}
      </Space>

      {createPortal(
        <FloatButton
          type="primary"
          shape="circle"
          onClick={() => scanner(true)}
          icon={<ScanOutlined />}
          style={{ transform: "scale(2)", right: 48 }}
        />,
        document.body,
      )}
    </>
  );
};
