import { ethers } from "ethers";
import { getNetwork, Network, NETWORK, NETWORKS } from "@constants";
import { isBaseNetwork } from "@modules/blockchain/utils";

const baseNetwork = getNetwork("base");

export const MAINNET_PROVIDER = new ethers.providers.StaticJsonRpcProvider(
  NETWORKS["mainnet"].rpcUrl,
  NETWORKS["mainnet"].chainId,
);
export const BASE_PROVIDER = new ethers.providers.StaticJsonRpcProvider(baseNetwork.rpcUrl, baseNetwork.chainId);
export const OPTIMISM_PROVIDER = new ethers.providers.StaticJsonRpcProvider(NETWORK.rpcUrl, NETWORK.chainId);

export function getNetworkProvider(network: Network | number) {
  if (isBaseNetwork(network)) return BASE_PROVIDER;
  return OPTIMISM_PROVIDER;
}
