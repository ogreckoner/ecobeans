import React from "react";
import { Button, Result } from "antd";

interface ConfirmSaveProps {
  onNext(): void;
}

export const ConfirmSave: React.FC<ConfirmSaveProps> = ({ onNext }) => {
  return (
    <Result
      status="success"
      title="Wallet saved successfully!"
      extra={[
        <Button type="primary" key="close-btn" onClick={onNext}>
          Close
        </Button>,
      ]}
    />
  );
};
