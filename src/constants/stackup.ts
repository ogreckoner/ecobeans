import { ethers } from "ethers";

// export interface ExecutionResult {
//   paid: ethers.BigNumber;
//   preOpGas: ethers.BigNumber;
//   targetResult: string;
//   targetSuccess: boolean;
//   validAfter: number;
//   validUntil: number;
// }

export const FLAT_FEE_AMOUNT = ethers.utils.parseEther(process.env.REACT_APP_FLAT_FEE_AMOUNT!);
export const FLAT_FEE_RECIPIENT = ethers.utils.getAddress(process.env.REACT_APP_FLAT_FEE_RECIPIENT!);

const STACKUP_OPTIMISM_API_KEY = process.env.REACT_APP_STACKUP_OPTIMISM_API_KEY!;
const STACKUP_BASE_API_KEY = process.env.REACT_APP_STACKUP_BASE_API_KEY!;

export const STACKUP_OPTIMISM_RPC_URL = `https://api.stackup.sh/v1/node/${STACKUP_OPTIMISM_API_KEY}`;
export const STACKUP_BASE_RPC_URL = `https://api.stackup.sh/v1/node/${STACKUP_BASE_API_KEY}`;

let paymasterUrl: string;
try {
  paymasterUrl = new URL("/paymaster/:network", process.env.REACT_APP_RELAYER_URL!).toString();
} catch (e) {
  throw new Error("Invalid Relayer URL");
}

export const PAYMASTER_URL_OPTIMISM = paymasterUrl.replace(":network", "optimism").toString();
export const PAYMASTER_URL_BASE = paymasterUrl.replace(":network", "base").toString();
