import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Client, Presets, UserOperationMiddlewareFn } from "userop";

import { Network, PAYMASTER_URL, STACKUP_BASE_RPC_URL, STACKUP_OPTIMISM_RPC_URL } from "@constants";

interface IStackupProvider {
  address?: string;
  signer: ethers.Signer;
}
interface StackupProviderProps {
  signer: ethers.Signer;
}

const StackupContext = React.createContext<IStackupProvider>({
  signer: {} as ethers.Signer,
});

export const FLAT_FEE_RECIPIENT = ethers.utils.getAddress(process.env.REACT_APP_FLAT_FEE_RECIPIENT!);
export const VERIFYING_PAYMASTER_ECO = Presets.Middleware.verifyingPaymaster(PAYMASTER_URL, { type: "flat" });

export const useStackup = () => React.useContext<IStackupProvider>(StackupContext);

function getStackupRpcUrl(network: Network) {
  return network === "base" ? STACKUP_BASE_RPC_URL : STACKUP_OPTIMISM_RPC_URL;
}

export const getSimpleAccount = (
  signer: ethers.Signer,
  network: Network,
  paymaster: UserOperationMiddlewareFn = VERIFYING_PAYMASTER_ECO,
) => {
  return Presets.Builder.SimpleAccount.init(signer, getStackupRpcUrl(network), { paymasterMiddleware: paymaster });
};

export const getClient = (network: Network) => {
  return Client.init(getStackupRpcUrl(network));
};

export const StackupProvider: React.FC<React.PropsWithChildren<StackupProviderProps>> = ({ signer, children }) => {
  const [address, setAddress] = useState<string>();

  useEffect(() => {
    (async () => {
      // Init Simple Account
      try {
        const simpleAccount = await getSimpleAccount(signer, "optimism");
        setAddress(simpleAccount.getSender());
      } catch (err) {
        console.error("error creating simple account", err);
      }
    })();
  }, [signer]);

  return <StackupContext.Provider value={{ signer, address }}>{children}</StackupContext.Provider>;
};
