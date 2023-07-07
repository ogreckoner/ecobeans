import { ethers } from "ethers";

import { useFlatFees } from "@hooks/useFlatFees";
import { ERC20__factory } from "@assets/contracts";
import { getTokenInfo, Network, Token } from "@constants";
import { getNetworkProvider } from "@modules/blockchain/providers";
import { getClient, getSimpleAccount, useStackup } from "@contexts/StackupContext";

export const useTokenTransfer = (tokenId: Token, network: Network = "optimism") => {
  const { signer } = useStackup();
  const { recipient } = useFlatFees();

  const transfer = async (to: string, amount: ethers.BigNumber, fee: ethers.BigNumber) => {
    const token = getTokenInfo(tokenId, network);
    const provider = getNetworkProvider(network);

    const client = await getClient(network);
    const simpleAccount = await getSimpleAccount(signer, network);

    const erc20 = ERC20__factory.connect(token.address, provider);

    const transferData = erc20.interface.encodeFunctionData("transfer", [to, amount]);
    const feeData = erc20.interface.encodeFunctionData("transfer", [recipient!, fee]);

    if (fee.isZero()) {
      simpleAccount.execute(erc20.address, 0, transferData);
    } else {
      simpleAccount.executeBatch([erc20.address, erc20.address], [transferData, feeData]);
    }

    return client.sendUserOperation(simpleAccount);
  };

  return { transfer };
};
