import { ethers } from "ethers";
import { Address, Hex } from "viem";
import {
  Chain,
  configureEnvironment,
  ExecutionReceipt,
  FunWallet,
  getChainFromData,
  UserOp,
  UserOperation,
} from "fun-wallet";
import { SimpleAccount } from "userop/dist/preset/builder";
import { EOASignature } from "userop/dist/preset/middleware";

import { NETWORK } from "@constants";
import { getSimpleAccount } from "@contexts/FunWalletContext";

import { flatVerifyingPaymaster } from "@modules/fun/middleware/paymaster";
import { estimateUserOperationGas } from "@modules/fun/middleware/estimateUserOpGas";
import {
  FLAT_VERIFYING_PAYMASTER_ADDRESS_BASE,
  FLAT_VERIFYING_PAYMASTER_ADDRESS_OPTIMISM,
} from "@modules/fun/constants";
import { isBaseNetwork } from "@modules/blockchain/utils";

export class FunSimpleAccount extends FunWallet {
  async executeBatch(
    simpleAccount: SimpleAccount,
    _chain: string | Chain | number = NETWORK.chainId,
    fee = ethers.constants.Zero,
  ): Promise<ExecutionReceipt> {
    const chain = await getChainFromData(_chain);
    // eslint-disable-next-line
    const _simpleAccount = simpleAccount as any;
    const provider: ethers.providers.JsonRpcProvider = _simpleAccount.provider;

    await configureEnvironment({
      chain,
      apiKey: process.env.REACT_APP_FUN_WALLET_API_KEY!,
    });

    await chain.init();

    const paymasterAddress = isBaseNetwork(provider.network.chainId)
      ? FLAT_VERIFYING_PAYMASTER_ADDRESS_BASE
      : FLAT_VERIFYING_PAYMASTER_ADDRESS_OPTIMISM;

    simpleAccount
      .resetMiddleware()
      .useMiddleware(_simpleAccount.resolveAccount)
      .useMiddleware(flatVerifyingPaymaster(provider, paymasterAddress, { fee, simulate: true }))
      .useMiddleware(estimateUserOperationGas(provider))
      .useMiddleware(flatVerifyingPaymaster(provider, paymasterAddress, { fee }))
      .useMiddleware(EOASignature(_simpleAccount.signer));

    const userOpRaw = await simpleAccount.buildOp(_simpleAccount.entryPoint.address, provider.network.chainId);
    const userOp = new UserOp(userOpRaw as UserOperation);
    const response = await this.sendTx(userOp);
    simpleAccount.resetOp();
    return response;
  }

  async getAddress(): Promise<Address> {
    if (!this.address) {
      const signer = new ethers.Wallet(this.identifier.uniqueId);
      const provider = new ethers.providers.StaticJsonRpcProvider(NETWORK.rpcUrl, NETWORK.chainId);
      const simpleAccount = await getSimpleAccount(signer, provider);
      this.address = simpleAccount.getSender() as Hex;
    }
    return this.address;
  }
}
