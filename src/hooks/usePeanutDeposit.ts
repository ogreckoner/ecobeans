import { ethers } from "ethers";

import { useFlatFees } from "@hooks/useFlatFees";
import { ERC20__factory } from "@assets/contracts";
import { getTokenInfo, Network, Token } from "@constants";
import { getClient, getSimpleAccount, useStackup } from "@contexts/StackupContext";

import * as Peanut from "@modules/peanut";
import { PEANUT_V3_ADDRESS } from "@modules/peanut/constants";
import { getNetworkProvider } from "@modules/blockchain/providers";

export const usePeanutDeposit = (network: Network = "optimism") => {
  const { recipient } = useFlatFees();
  const { address, signer } = useStackup();

  const deposit = async (tokenId: Token, password: string, amount: ethers.BigNumber, fee: ethers.BigNumber) => {
    if (!address) return;

    const token = getTokenInfo(tokenId);
    const provider = getNetworkProvider(network);
    const { transaction: depositTx } = await Peanut.makeDeposit(token.address, amount, password);

    const erc20 = ERC20__factory.connect(token.address, provider);
    const peanutAllowance = await erc20.allowance(address, PEANUT_V3_ADDRESS);

    const feeData = erc20.interface.encodeFunctionData("transfer", [recipient!, fee]);
    const feeTx = { to: token.address, data: feeData };

    const txs = [];

    if (peanutAllowance.lt(amount)) {
      const data = erc20.interface.encodeFunctionData("approve", [PEANUT_V3_ADDRESS, amount]);
      txs.push({ to: token.address, data });
    }

    txs.push(depositTx);
    txs.push(feeTx);

    const simpleAccount = await getSimpleAccount(signer, network);
    simpleAccount.executeBatch(
      txs.map(tx => tx.to),
      txs.map(tx => tx.data),
    );

    const client = await getClient(network);
    const tx = await client.sendUserOperation(simpleAccount);
    return tx.wait();
  };

  return { deposit };
};
