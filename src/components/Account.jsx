import React from "react";
import Wallet from "./Wallet";

export default function Account({ address, userSigner, localProvider }) {
  return (
    <div style={{ display: "flex" }}>
      <span>
        <Wallet
          signer={userSigner}
          address={address}
          padding="0px"
          color="#06153c"
          provider={localProvider}
          ensProvider={localProvider}
          size={36}
        />
      </span>
    </div>
  );
}
