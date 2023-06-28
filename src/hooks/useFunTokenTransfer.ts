import { useMemo } from "react";
import { ethers } from "ethers";

import { ERC20__factory } from "@assets/contracts";
import { getTokenInfo, Network, Token } from "@constants";

import { getSimpleAccount, useFunWallet } from "@contexts/FunWalletContext";

import { isBaseNetwork } from "@modules/blockchain/utils";
import { getNetworkProvider } from "@modules/blockchain/providers";
import {
  FLAT_VERIFYING_PAYMASTER_ADDRESS_BASE,
  FLAT_VERIFYING_PAYMASTER_ADDRESS_OPTIMISM,
} from "@modules/fun/constants";

export const useFunTokenTransfer = (tokenId: Token, network: Network | number = "optimism") => {
  const { address, wallet, signer } = useFunWallet();

  const provider = useMemo(() => getNetworkProvider(network), [network]);

  const transfer = async (t: string, amount: ethers.BigNumber, fee: ethers.BigNumber): Promise<string> => {
    const to = ethers.utils.getAddress(t);
    const token = getTokenInfo(tokenId, network);
    const paymasterAddress = isBaseNetwork(network)
      ? FLAT_VERIFYING_PAYMASTER_ADDRESS_BASE
      : FLAT_VERIFYING_PAYMASTER_ADDRESS_OPTIMISM;

    const simpleAccount = await getSimpleAccount(signer, provider);

    const erc20 = ERC20__factory.connect(token.address, provider);
    const data = erc20.interface.encodeFunctionData("transfer", [to, amount]);

    const allowance = await erc20.allowance(address, paymasterAddress);
    const hasEnoughAllowance = allowance.gte(ethers.utils.parseUnits("1000", token.decimals));

    if (hasEnoughAllowance) {
      simpleAccount.execute(erc20.address, 0, data);
    } else {
      // Execute transaction and approve Paymaster to spend tokens to pay gas fees in ECO tokens
      simpleAccount.executeBatch(
        [erc20.address, erc20.address],
        [data, erc20.interface.encodeFunctionData("approve", [paymasterAddress, ethers.constants.MaxUint256])],
      );
    }

    const res = await wallet.executeBatch(simpleAccount, provider.network.chainId, fee);
    return res.txid!;
  };

  return { transfer };
};
