import React from "react";
import { Button, Result } from "antd";

interface ConfirmRecoveryProps {
  onNext(): void;
}

export const ConfirmRecovery: React.FC<ConfirmRecoveryProps> = ({ onNext }) => {
  return (
    <Result
      status="success"
      title="Wallet recovered successfully!"
      extra={[
        <Button type="primary" key="close-btn" onClick={onNext}>
          Close
        </Button>,
      ]}
    />
  );
};
