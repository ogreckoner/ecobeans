import React, { useEffect } from "react";
import { Space, Spin, Typography } from "antd";

import { useWeb3Auth } from "@hooks/useWeb3Auth";
import { LoadingOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface LocalShareStepProps {
  onNext(): void;

  onComplete(): void;
}

export const LocalShareStep: React.FC<LocalShareStepProps> = ({ onNext, onComplete }) => {
  const web3Auth = useWeb3Auth();

  useEffect(() => {
    (async () => {
      try {
        await web3Auth.getShareFromStorage();
        onComplete();
      } catch (error) {
        console.warn("[getShareFromStorage:error]", error);
        onNext();
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
