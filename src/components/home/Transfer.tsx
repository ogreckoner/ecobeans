import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BigNumber, ethers } from "ethers";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ScanOutlined, SendOutlined } from "@ant-design/icons";
import { Alert, Button, FloatButton, Input, InputProps, Space, Spin, Typography } from "antd";

import { useAlert } from "@hooks/useAlert";
import { FeeOperation, useOperationFee } from "@hooks/useOperationFee";
import { blockExplorerLink, convertAmount, formatTokenAmount } from "@helpers";

// Components
import { Address } from "@components";
import { TokenIcon } from "@components/token";
import { TokenFee } from "@components/commons/TokenFee";
import { AddressInput } from "@components/AddressInput";
import { useCurrentToken } from "@components/home/context/TokenContext";
import { getNetwork, getTokenInfo, IS_BASE_ENABLED, NETWORK, Network, NETWORKS } from "@constants";
import { useTokenTransfer } from "@hooks/useTokenTransfer";

function getTotal(amount: string, decimals: number) {
  try {
    return convertAmount(amount, decimals).abs();
  } catch (e) {
    return ethers.constants.Zero;
  }
}

let scanner: (show: boolean) => void;

type TransferAmount = { amount: BigNumber; fee: BigNumber };

function getTransferAmount(
  amount: BigNumber,
  fee: BigNumber,
  balance: BigNumber,
): TransferAmount & { remaining: TransferAmount } {
  const total = amount.add(fee);
  if (amount.isZero()) {
    return { amount: ethers.constants.Zero, fee: ethers.constants.Zero, remaining: { fee, amount } };
  } else if (balance.lte(fee)) {
    return { amount: balance, fee: ethers.constants.Zero, remaining: { fee, amount: amount.sub(balance) } };
  } else if (balance.lte(total)) {
    return {
      fee: fee,
      amount: balance.sub(fee),
      remaining: { fee: ethers.constants.Zero, amount: total.sub(balance) },
    };
  }
  return { amount, fee, remaining: { fee: ethers.constants.Zero, amount: ethers.constants.Zero } };
}

function calculateTransferAmounts(total: BigNumber, fee: BigNumber, balances: BigNumber[]): TransferAmount[] {
  const transfers = [];
  let remainingData = { amount: total, fee: fee };

  for (let i = 0; i < balances.length; i++) {
    const { amount, fee, remaining } = getTransferAmount(remainingData.amount, remainingData.fee, balances[i]);
    remainingData = remaining;
    transfers.push({ amount, fee });
  }

  const remainingTotal = remainingData.amount.add(remainingData.fee);
  if (!remainingTotal.isZero()) throw new Error("Exceed balance");

  return transfers;
}

interface NetworkTransfer<TransferFunc> {
  network: Network;
  state: "loading" | "success" | "error";
  balance: ethers.BigNumber;
  amount: ethers.BigNumber;
  fee: ethers.BigNumber;
  transfer: TransferFunc;
  userOpHash: null | string;
  txHash: null | string;
}

interface CircleProps {
  type?: "warning" | "success" | "error";
}

const Circle: React.FC<CircleProps> = ({ type = "warning" }) => {
  if (type === "warning") {
    return <Spin size="small" />;
  }
  return (
    <div
      style={{
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: type === "error" ? "red" : "lightgreen",
      }}
    />
  );
};

export const Transfer: React.FC = () => {
  const { token: tokenId, balance, optimismBalance, baseBalance } = useCurrentToken();

  const navigate = useNavigate();
  const token = getTokenInfo(tokenId);

  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [toAddress, setToAddress] = useState("");

  const { data: fee } = useOperationFee(tokenId, FeeOperation.Transfer);

  const { transfer: transferBase } = useTokenTransfer(tokenId, "base");
  const { transfer: transferOptimism } = useTokenTransfer(tokenId, "optimism");

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
      const networkTransfers: NetworkTransfer<typeof transferOptimism>[] = [
        {
          network: NETWORK.id as Network,
          state: "loading",
          balance: optimismBalance,
          amount: ethers.constants.Zero,
          fee: ethers.constants.Zero,
          transfer: transferOptimism,
          userOpHash: null,
          txHash: null,
        },
      ];

      if (IS_BASE_ENABLED) {
        networkTransfers.push({
          network: getNetwork("base").id as Network,
          state: "loading",
          balance: baseBalance,
          amount: ethers.constants.Zero,
          fee: ethers.constants.Zero,
          transfer: transferBase,
          userOpHash: null,
          txHash: null,
        });
      }

      const balances = networkTransfers.map(network => network.balance);
      const transferAmounts = calculateTransferAmounts(value, fee, balances);

      const update = () => {
        const hasAnError = networkTransfers.some(network => network.state === "error");
        const transferred = networkTransfers
          .filter(network => network.state !== "error")
          .reduce((acc, network) => acc.add(network.amount), ethers.constants.Zero);

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
              {networkTransfers
                .filter(transfer => !transfer.amount.isZero())
                .map(transfer => {
                  return (
                    <Typography.Link
                      target="_blank"
                      key={transfer.network}
                      disabled={!transfer.txHash}
                      href={transfer.txHash ? blockExplorerLink(transfer.txHash, transfer.network) : undefined}
                      style={{ gap: 8, display: "flex", alignItems: "center" }}
                    >
                      <Circle
                        type={
                          transfer.state === "success" ? "success" : transfer.state === "loading" ? "warning" : "error"
                        }
                      />
                      See {NETWORKS[transfer.network].name} transaction
                    </Typography.Link>
                  );
                })}
            </>
          ),
        });
      };

      networkTransfers.forEach((network, index) => {
        const { amount, fee } = transferAmounts[index];
        network.amount = amount;
        network.fee = fee;
        if (!amount.isZero()) {
          const request = network.transfer(toAddress, amount, fee);
          request
            .then(response => {
              network.userOpHash = response.userOpHash;
              update();
              return response.wait();
            })
            .then(result => {
              if (result) {
                network.state = "success";
                network.txHash = result.transactionHash;
              } else {
                console.error(`[${network.network}-transfer] transaction hash is null`, network, result);
                network.state = "error";
              }
              update();
            })
            .catch(err => {
              console.error(`[${network.network}-transfer]`, err);
              network.state = "error";
              update();
            });
        } else {
          network.state = "success";
          update();
        }
      });

      update();
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

  const setMaxAmount = () => {
    if (balance && fee) setAmount(ethers.utils.formatUnits(balance.sub(fee)));
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
          suffix={
            <Button type="default" size="small" onClick={setMaxAmount}>
              Max
            </Button>
          }
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
