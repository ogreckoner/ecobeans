import { ethers } from "ethers";
import { IUserOperation } from "userop";
import { SimpleAccount } from "userop/dist/preset/builder";

import { useFlatFees } from "@hooks/useFlatFees";
import { ERC20__factory } from "@assets/contracts";
import { getTokenInfo, Network, Token } from "@constants";
import { getNetworkProvider } from "@modules/blockchain/providers";
import { getClient, getFlatPaymaster, getFreePaymaster, getSimpleAccount, useStackup } from "@contexts/StackupContext";

export const useTokenTransfer = (tokenId: Token, network: Network = "optimism") => {
  const { signer } = useStackup();
  const { recipient } = useFlatFees();

  const transfer = async (
    to: string,
    amount: ethers.BigNumber,
    fee: ethers.BigNumber,
    options?: {
      dryRun?: boolean;
      userOpWithFee?: IUserOperation;
      onUserOpWithFeeTx?: (txHash: string) => void;
    },
  ) => {
    const { dryRun, onUserOpWithFeeTx, userOpWithFee } = options || {};
    const token = getTokenInfo(tokenId, network);
    const provider = getNetworkProvider(network);
    const client = await getClient(network);
    const erc20 = ERC20__factory.connect(token.address, provider);

    const feeData = erc20.interface.encodeFunctionData("transfer", [recipient!, fee]);
    const transferData = erc20.interface.encodeFunctionData("transfer", [to, amount]);

    let simpleAccount: SimpleAccount;
    if (fee.isZero() && userOpWithFee && onUserOpWithFeeTx) {
      simpleAccount = await getSimpleAccount(
        signer,
        network,
        getFreePaymaster(network, userOpWithFee, onUserOpWithFeeTx),
      );
      simpleAccount.execute(erc20.address, 0, transferData);
    } else {
      simpleAccount = await getSimpleAccount(signer, network, getFlatPaymaster(network));
      simpleAccount.executeBatch([erc20.address, erc20.address], [transferData, feeData]);
    }

    if (dryRun) return client.buildUserOperation(simpleAccount);
    return client.sendUserOperation(simpleAccount);
  };

  return { transfer };
};
