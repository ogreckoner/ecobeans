import { useCallback } from "react";
import { ethers } from "ethers";

import * as Peanut from "@modules/peanut";
import { ERC20__factory } from "@assets/contracts";
import { FLAT_FEE_RECIPIENT } from "@contexts/StackupContext";
import { getTokenInfo, Token, VERIFYING_PAYMASTER_ADDRESS } from "@constants";
import { PEANUT_V3_ADDRESS } from "@modules/peanut/constants";
import { OPTIMISM_PROVIDER } from "@modules/blockchain/providers";
import { getSimpleAccount, useFunWallet } from "@contexts/FunWalletContext";

const provider = OPTIMISM_PROVIDER;

export const usePeanutDeposit = () => {
  const { address, wallet, signer } = useFunWallet();

  const buildOps = useCallback(
    async (tokenId: Token, value: ethers.BigNumber, fee: ethers.BigNumber, password?: string) => {
      const token = getTokenInfo(tokenId);
      const { transaction } = await Peanut.makeDeposit(token.address, value, password);

      const erc20 = ERC20__factory.connect(token.address, provider);

      const peanutAllowance = await erc20.allowance(address, PEANUT_V3_ADDRESS);
      const paymasterAllowance = await erc20.allowance(address, VERIFYING_PAYMASTER_ADDRESS);

      const feeData = erc20.interface.encodeFunctionData("transfer", [FLAT_FEE_RECIPIENT, fee]);
      const feeTx = { to: token.address, data: feeData };

      const txs = [feeTx, transaction];

      if (peanutAllowance.lt(value)) {
        const data = ERC20__factory.createInterface().encodeFunctionData("approve", [PEANUT_V3_ADDRESS, value]);
        txs.push({ to: token.address, data });
      }

      if (paymasterAllowance.lt(ethers.constants.WeiPerEther.mul(10_000))) {
        // If paymaster's allowance is less than 10.000 ECO tokens
        // Include token approval for paymaster to pay gas in ECO tokens
        const data = ERC20__factory.createInterface().encodeFunctionData("approve", [
          VERIFYING_PAYMASTER_ADDRESS,
          ethers.constants.MaxUint256,
        ]);
        txs.push({ to: token.address, data });
      }

      // Reverse order of transactions to execute token approvals first
      txs.reverse();

      const simpleAccount = await getSimpleAccount(signer, provider);

      simpleAccount.executeBatch(
        txs.map(tx => tx.to),
        txs.map(tx => tx.data),
      );

      return simpleAccount;
    },
    [address, provider],
  );

  const deposit = async (token: Token, password: string, amount: ethers.BigNumber, fee: ethers.BigNumber) => {
    const simpleAccount = await buildOps(token, amount, fee, password);

    const res = await wallet.executeBatch(simpleAccount, provider.network.chainId, fee);
    return { transactionHash: res.txid! };
  };

  return { deposit };
};
