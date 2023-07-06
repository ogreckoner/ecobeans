import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Client, Presets, UserOperationMiddlewareFn } from "userop";

import {
  Network,
  PAYMASTER_URL_BASE,
  PAYMASTER_URL_OPTIMISM,
  STACKUP_BASE_RPC_URL,
  STACKUP_OPTIMISM_RPC_URL,
} from "@constants";

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

export const useStackup = () => React.useContext<IStackupProvider>(StackupContext);

function getStackupRpcUrl(network: Network) {
  return network === "base" ? STACKUP_BASE_RPC_URL : STACKUP_OPTIMISM_RPC_URL;
}

function getPaymaster(network: Network) {
  const url = network === "base" ? PAYMASTER_URL_BASE : PAYMASTER_URL_OPTIMISM;
  return Presets.Middleware.verifyingPaymaster(url, { type: "flat" });
}

export const getSimpleAccount = (
  signer: ethers.Signer,
  network: Network,
  paymaster: UserOperationMiddlewareFn = getPaymaster(network),
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
