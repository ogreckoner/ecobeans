import React, { useState } from "react";
import { ethers } from "ethers";
import { Space, Steps } from "antd";

import { SocialStep } from "@components/menu/save-access/SocialStep";
import { LocalShareStep } from "@components/menu/recover-access/LocalShareStep";
import { ConfirmRecovery } from "@components/menu/recover-access/ConfirmRecovery";
import { RecoverShareStep } from "@components/menu/recover-access/RecoverShareStep";

interface RecoverAccessProps {
  signer: ethers.Wallet;

  onClose(): void;
}

export const RecoverAccess: React.FC<RecoverAccessProps> = ({ signer, onClose }) => {
  const [step, setStep] = useState(0);

  if (step === 3) return <ConfirmRecovery onNext={onClose} />;

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <i>To recover your wallet you have to get 2 out of 3 shares</i>

        <Steps
          responsive
          status={step === 1 ? "wait" : undefined}
          current={step}
          items={[
            {
              title: "Social Share",
              onClick: () => step > 1 && setStep(1),
            },
            {
              title: "Local Share",
              status: step >= 2 ? "error" : undefined,
            },
            {
              title: "Recovery Share",
            },
          ]}
        />

        <hr />
      </Space>

      {step === 0 ? (
        <SocialStep onNext={() => setStep(1)} onPrevious={onClose} />
      ) : step === 1 ? (
        <LocalShareStep signer={signer} onNext={() => setStep(2)} onComplete={() => setStep(3)} onClose={onClose} />
      ) : (
        <RecoverShareStep signer={signer} onPrevious={() => setStep(0)} onNext={() => setStep(3)} onClose={onClose} />
      )}
    </Space>
  );
};
