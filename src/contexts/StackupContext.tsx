import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Client, IUserOperation, Presets, UserOperationMiddlewareFn } from "userop";

import {
  Network,
  PAYMASTER_URL_BASE,
  PAYMASTER_URL_OPTIMISM,
  STACKUP_BASE_RPC_URL,
  STACKUP_OPTIMISM_RPC_URL,
} from "@constants";
import { OpToJSON } from "userop/dist/utils";

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

function getStackupPaymasterUrl(network: Network) {
  return network === "base" ? PAYMASTER_URL_BASE : PAYMASTER_URL_OPTIMISM;
}

export function getFlatPaymaster(network: Network) {
  const url = getStackupPaymasterUrl(network);
  return Presets.Middleware.verifyingPaymaster(url, { type: "flat" });
}

export function getFreePaymaster(
  network: Network,
  userOpWithFee: IUserOperation,
  onUserOpFee: (userOpTx: string) => void,
): UserOperationMiddlewareFn {
  const paymasterRpc = getStackupPaymasterUrl(network);
  const context = { type: "free", userOpWithFee };

  return async ctx => {
    ctx.op.verificationGasLimit = ethers.BigNumber.from(ctx.op.verificationGasLimit).mul(3);

    const provider = new ethers.providers.JsonRpcProvider(paymasterRpc);
    const pm = await provider.send("pm_sponsorUserOperation", [OpToJSON(ctx.op), ctx.entryPoint, context]);

    ctx.op.paymasterAndData = pm.paymasterAndData;
    ctx.op.preVerificationGas = pm.preVerificationGas;
    ctx.op.verificationGasLimit = pm.verificationGasLimit;
    ctx.op.callGasLimit = pm.callGasLimit;

    try {
      onUserOpFee(pm.userOpWithFee.transaction.hash);
    } catch (e) {
      console.error("getFreePaymaster - onUserOpFee: ", e);
    }
  };
}

export const getSimpleAccount = (signer: ethers.Signer, network: Network, paymaster?: UserOperationMiddlewareFn) => {
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
