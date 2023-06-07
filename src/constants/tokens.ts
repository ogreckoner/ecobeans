import { ethers } from "ethers";

export const ECO_TOKEN_ADDRESS = ethers.utils.getAddress(process.env.REACT_APP_ECO_TOKEN_ADDRESS!);
export const USDC_TOKEN_ADDRESS = ethers.utils.getAddress(process.env.REACT_APP_USDC_TOKEN_ADDRESS!);