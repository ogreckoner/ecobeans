import React, { useEffect } from "react";
import { notification, Space, Spin, Typography } from "antd";

import { useWeb3Auth } from "@hooks/useWeb3Auth";
import { LoadingOutlined } from "@ant-design/icons";
import { ethers } from "ethers";

const { Text } = Typography;

interface LocalShareStepProps {
  signer: ethers.Wallet;

  onNext(): void;
  onClose(): void;
  onComplete(): void;
}

export const LocalShareStep: React.FC<LocalShareStepProps> = ({ onNext, onComplete, onClose }) => {
  const web3Auth = useWeb3Auth();

  useEffect(() => {
    (async () => {
      try {
        await web3Auth.getShareFromStorage();
      } catch (error) {
        console.warn("[getShareFromStorage:error]", error);
        onNext();
        return;
      }
      try {
        await web3Auth.reconstruct();
        onComplete();
      } catch (error) {
        notification.error({
          placement: "topRight",
          message: "Unable to recover access",
          description: "There is not a wallet stored",
        });
        onClose();
      }
    })();
  }, []);

  return (
    <Space direction="vertical" align="center" style={{ width: "100%" }}>
      <Spin indicator={<LoadingOutlined style={{ fontSize: 36 }} spin />} />
      <Text>Getting local share...</Text>
    </Space>
  );
};
