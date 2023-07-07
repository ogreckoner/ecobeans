import { ethers } from "ethers";
import { INetwork, Network, NETWORK, NETWORKS } from "@constants";

export function blockExplorerLink(addressOrHash: string, _network: INetwork | Network = NETWORK): string {
  const path = ethers.utils.isAddress(addressOrHash) ? `address/${addressOrHash}` : `tx/${addressOrHash}`;
  const network = typeof _network === "string" ? NETWORKS[_network] : _network;
  return new URL(path, network.blockExplorer).toString();
}
