import React, { useState } from "react";
import { Button, Col, Row, Space } from "antd";
import { GoogleOutlined, TwitterOutlined } from "@ant-design/icons";

import { AuthMethod } from "@constants/web3auth";
import { useWeb3Auth } from "@hooks/useWeb3Auth";

interface SocialStepProps {
  reconstruct?: boolean;
  onPrevious(): void;
  onNext(): void;
}

export const SocialStep: React.FC<SocialStepProps> = ({ onPrevious, onNext, reconstruct }) => {
  const web3Auth = useWeb3Auth();

  const [loading, setLoading] = useState<AuthMethod>();

  const login = async (method: AuthMethod) => {
    setLoading(method);
    try {
      await web3Auth.login(method, reconstruct);
      onNext();
    } catch (error) {
      console.log("error", error);
    } finally {
      setLoading(undefined);
    }
  };

  return (
    <>
      <Row justify="space-around" align="middle" style={{ padding: "16px 0 24px 0" }}>
        <Col span={12}>
          <span>Choose one platform to authenticate with:</span>
        </Col>
        <Col span={12} style={{ display: "flex", justifyContent: "center" }}>
          <Space size="large">
            <Button
              size="large"
              shape="circle"
              type="primary"
              disabled={loading !== undefined}
              loading={loading === AuthMethod.TWITTER}
              onClick={() => login(AuthMethod.TWITTER)}
              icon={<TwitterOutlined style={{ fontSize: 24 }} />}
            />
            <Button
              size="large"
              shape="circle"
              type="primary"
              disabled={loading !== undefined}
              loading={loading === AuthMethod.GOOGLE}
              onClick={() => login(AuthMethod.GOOGLE)}
              icon={<GoogleOutlined style={{ fontSize: 24 }} />}
            />
          </Space>
        </Col>
      </Row>

      <Button type="default" onClick={onPrevious}>
        Back
      </Button>
    </>
  );
};
