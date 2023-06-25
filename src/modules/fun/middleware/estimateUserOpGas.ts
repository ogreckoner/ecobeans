import { ethers } from "ethers";

import { UserOperationMiddlewareFn } from "userop";
import { OpToJSON } from "userop/dist/utils";

import { FunClient } from "@modules/fun/FunClient";

async function estimateCreationGas(
  provider: ethers.providers.JsonRpcProvider,
  initCode: ethers.BytesLike,
): Promise<ethers.BigNumber> {
  const initCodeHex = ethers.utils.hexlify(initCode);
  const factory = initCodeHex.substring(0, 42);
  const callData = "0x" + initCodeHex.substring(42);
  return await provider.estimateGas({
    to: factory,
    data: callData,
  });
}
export const estimateUserOperationGas =
  (provider: ethers.providers.JsonRpcProvider): UserOperationMiddlewareFn =>
  async ctx => {
    if (ethers.BigNumber.from(ctx.op.nonce).isZero()) {
      ctx.op.verificationGasLimit = ethers.BigNumber.from(ctx.op.verificationGasLimit).add(
        await estimateCreationGas(provider, ctx.op.initCode),
      );
    }

    ctx.op.maxFeePerGas = (await provider.getGasPrice()).toHexString();

    const est = await FunClient.estimateUserOp(provider, ctx.entryPoint, OpToJSON(ctx.op));

    ctx.op.callGasLimit = est.callGasLimit;
    ctx.op.preVerificationGas = est.preVerificationGas;
    ctx.op.verificationGasLimit = est.verificationGas;

    const MINIMUM_CALL_GAS_LIMIT = 200_000;
    if (ethers.BigNumber.from(ctx.op.callGasLimit).lte(MINIMUM_CALL_GAS_LIMIT)) {
      ctx.op.callGasLimit = ethers.BigNumber.from(MINIMUM_CALL_GAS_LIMIT).toHexString();
    }
  };
