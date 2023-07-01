import React, { useState } from "react";
import { ethers } from "ethers";
import { Button, Form, Input, Space } from "antd";

import { useWeb3Auth } from "@hooks/useWeb3Auth";

interface RecoveryStepProps {
  signer: ethers.Wallet;

  onNext(): void;

  onPrevious(): void;
}

export const RecoveryStep: React.FC<RecoveryStepProps> = ({ signer, onNext, onPrevious }) => {
  const web3Auth = useWeb3Auth();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);

  const onFinish = async ({ password }: { password: string }) => {
    setLoading(true);
    try {
      await web3Auth.save(signer, password);
      onNext();
    } catch (error) {
      console.log("error", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form form={form} onFinish={onFinish} layout="vertical" disabled={loading}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <span>To recover your account you will need to input a password</span>
          <Form.Item
            name="password"
            label="Password"
            rules={[
              {
                required: true,
                message: "Please input your password",
              },
              { min: 8, message: "Minimum length is 8 characters" },
            ]}
            hasFeedback
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            name="confirm"
            label="Confirm Password"
            dependencies={["password"]}
            hasFeedback
            rules={[
              {
                required: true,
                message: "Please confirm your password",
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("The password that you entered do not match"));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
        </Space>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Button type="default" onClick={onPrevious}>
            Back
          </Button>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Save
            </Button>
          </Form.Item>
        </div>
      </Space>
    </Form>
  );
};
