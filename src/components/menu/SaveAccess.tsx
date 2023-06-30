import React, { useState } from "react";
import { ethers } from "ethers";
import { Space, Steps } from "antd";

import { SocialStep } from "@components/menu/save-access/SocialStep";
import { RecoveryStep } from "@components/menu/save-access/RecoveryStep";
import { ConfirmSave } from "@components/menu/save-access/ConfirmSave";

interface SaveAccessProps {
  signer: ethers.Wallet;
  onClose(): void;
}

export const SaveAccess: React.FC<SaveAccessProps> = ({ signer, onClose }) => {
  const [step, setStep] = useState(1);

  if (step === 3) return <ConfirmSave onNext={onClose} />;

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <i>Save access will split your key into 3 shares</i>

        <Steps
          responsive
          current={step}
          items={[
            {
              title: "Local Share",
              onClick: () => step > 1 && setStep(1),
            },
            {
              title: "Social Share",
              onClick: () => step > 2 && setStep(2),
            },
            {
              title: "Recovery Share",
            },
          ]}
        />

        <hr />
      </Space>

      {step === 1 ? (
        <SocialStep reconstruct onNext={() => setStep(2)} onPrevious={onClose} />
      ) : (
        <RecoveryStep signer={signer} onNext={() => setStep(3)} onPrevious={() => setStep(1)} />
      )}
    </Space>
  );
};
