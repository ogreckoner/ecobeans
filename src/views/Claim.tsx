import React, { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { useNavigate } from "react-router-dom";
import { useContractReader } from "eth-hooks";
import { Button, notification, Skeleton, Space, Typography } from "antd";
import { SendOutlined } from "@ant-design/icons";

import * as Peanut from "@modules/peanut";
import { Deposit } from "@modules/peanut/types";
import { PEANUT_V3_ADDRESS } from "@modules/peanut/constants";

import { PeanutV3__factory } from "@assets/contracts";
import { getTokenInfo, NETWORK, Token } from "@constants";

import { getTransaction } from "@helpers/contracts";
import { blockExplorerLink, formatTokenAmount } from "@helpers";

import { TokenIcon } from "@components/token";
import { useStackup } from "@contexts/StackupContext";
import { getNetworkProvider } from "@modules/blockchain/providers";

interface ClaimContentProps {
  token: Token;
  chainId: number;
}

const TokenResolution: React.FC<{ children: (props: ClaimContentProps) => React.ReactElement | null }> = ({
  children,
}) => {
  const navigate = useNavigate();
  const { token: rawToken = "eco", chainId } = Peanut.getParamsFromLink();

  const [token, setToken] = useState<Token | undefined>();

  useEffect(() => {
    try {
      getTokenInfo(rawToken);
      setToken(rawToken as Token);
    } catch (err) {
      navigate("/t/eco");
    }
  }, []);

  if (!token) return null;

  return children({ token, chainId: chainId || NETWORK.chainId });
};

export const Claim: React.FC = props => {
  return <TokenResolution>{resolutionProps => <ClaimContent {...resolutionProps} {...props} />}</TokenResolution>;
};

const ClaimContent: React.FC<ClaimContentProps> = ({ token: tokenId, chainId }) => {
  const token = getTokenInfo(tokenId);
  const { depositIdx, password } = Peanut.getParamsFromLink();

  const navigate = useNavigate();
  const { address } = useStackup();

  const [loading, setLoading] = useState(false);

  const peanutV3 = useMemo(() => {
    const provider = getNetworkProvider(chainId);
    return PeanutV3__factory.connect(PEANUT_V3_ADDRESS, provider);
  }, [chainId]);

  const [result, , state] = useContractReader(peanutV3, peanutV3.deposits, [depositIdx!], undefined, {
    blockNumberInterval: 1,
    query: {
      retry: false,
      enabled: depositIdx !== undefined,
      select: deposit => ({ pubKey20: deposit[0], amount: deposit[1], tokenAddress: deposit[2] }),
    },
  });

  const deposit = result as Deposit | undefined;

  useEffect(() => {
    const goBack = () => navigate(`/t/${tokenId}`);
    if (!password || depositIdx === undefined || state === "error") {
      goBack();
    } else if (deposit) {
      const signerWallet = Peanut.generateKeysFromString(password);
      if (signerWallet.address !== deposit.pubKey20 || deposit.tokenAddress !== token.address) {
        goBack();
      }
    }
  }, [deposit, depositIdx, navigate, password, state]);

  const doSend = async () => {
    if (!address || !deposit || !password || depositIdx === undefined) return;
    setLoading(true);
    try {
      const provider = getNetworkProvider(chainId);
      const response = await Peanut.sendClaimRequest({
        password,
        depositIdx,
        recipient: address,
      });

      const tx = await getTransaction(provider, response.receipt.transactionHash);
      if (tx.wait) await tx.wait();

      notification.success({
        placement: "topRight",
        message: "Transfer Executed!",
        duration: 10000,
        description: (
          <>
            You have successfully claimed{" "}
            <b>
              {formatTokenAmount(ethers.utils.formatUnits(deposit.amount, token.decimals), 3)} {token.name}
            </b>{" "}
            tokens. <br />
            <Typography.Link href={blockExplorerLink(response.receipt.transactionHash)} target="_blank">
              See transaction.
            </Typography.Link>
          </>
        ),
      });

      navigate(`/t/${token.id}`);
    } catch (e) {
      console.log("[gasless:transfer]", e);
      notification.error({
        placement: "topRight",
        message: "Transfer failed",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Space direction="vertical" align="center" style={{ width: "100%" }}>
      <Space direction="vertical" size="large" align="center" style={{ marginTop: 24 }}>
        <Space.Compact
          direction="horizontal"
          style={{ gap: 8, width: "100%", alignItems: "center", justifyContent: "center", minHeight: 38 }}
        >
          <TokenIcon token={token.id} style={{ width: 28, height: 28 }} />
          {deposit ? (
            <Typography.Title data-cy="claim-amount" level={2} style={{ margin: 0 }}>
              {formatTokenAmount(parseFloat(ethers.utils.formatUnits(deposit.amount, token.decimals)), 2)}
            </Typography.Title>
          ) : (
            <Skeleton.Input />
          )}
        </Space.Compact>
        <Button
          data-cy="claim-btn"
          key="submit"
          size="large"
          type="primary"
          onClick={doSend}
          loading={loading}
          disabled={!deposit || loading}
          icon={<SendOutlined />}
        >
          Claim
        </Button>
      </Space>
    </Space>
  );
};
