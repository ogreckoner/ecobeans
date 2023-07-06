// export interface ExecutionResult {
//   paid: ethers.BigNumber;
//   preOpGas: ethers.BigNumber;
//   targetResult: string;
//   targetSuccess: boolean;
//   validAfter: number;
//   validUntil: number;
// }

const STACKUP_OPTIMISM_API_KEY = process.env.REACT_APP_STACKUP_OPTIMISM_API_KEY!;
const STACKUP_BASE_API_KEY = process.env.REACT_APP_STACKUP_BASE_API_KEY!;

export const STACKUP_OPTIMISM_RPC_URL = `https://api.stackup.sh/v1/node/${STACKUP_OPTIMISM_API_KEY}`;
export const STACKUP_BASE_RPC_URL = `https://api.stackup.sh/v1/node/${STACKUP_BASE_API_KEY}`;

let paymasterUrl: URL;
try {
  paymasterUrl = new URL("/paymaster", process.env.REACT_APP_RELAYER_URL!);
} catch (e) {
  throw new Error("Invalid Relayer URL");
}
export const PAYMASTER_URL = paymasterUrl.toString();
