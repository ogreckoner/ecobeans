import React, { useState } from "react";
import { ethers } from "ethers";
import { Button, Form, Input, notification, Space } from "antd";

import { useWeb3Auth } from "@hooks/useWeb3Auth";

interface RecoverShareStepProps {
  signer: ethers.Wallet;

  onNext(): void;
  onClose(): void;
  onPrevious(): void;
}

export const RecoverShareStep: React.FC<RecoverShareStepProps> = ({ onNext, onPrevious, onClose }) => {
  const web3Auth = useWeb3Auth();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [invalidPassword, setInvalidPassword] = useState<string>();

  const onFinish = async ({ password }: { password: string }) => {
    setLoading(true);
    try {
      await web3Auth.answerSecurityQuestions(password);
    } catch (error) {
      // eslint-disable-next-line
      if ((error as any).message === "Incorrect answer") {
        setInvalidPassword(password);
        form.validateFields();
      }
      setLoading(false);
      return;
    }
    try {
      await web3Auth.reconstruct();
      onNext();
    } catch (error) {
      notification.error({
        placement: "topRight",
        message: "Unable to recover access",
        description: "There is not a wallet stored",
      });
      onClose();
    }
    setLoading(false);
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
              () => ({
                validator(_, value) {
                  if (!value || invalidPassword !== value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Password is invalid"));
                },
              }),
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
              Register
            </Button>
          </Form.Item>
        </div>
      </Space>
    </Form>
  );
};
