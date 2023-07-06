export const INFURA_ID = process.env.REACT_APP_INFURA_ID;

export type Network = "optimism" | "base";
type AllNetwork = Network | "mainnet" | "goerli-optimism" | "base-goerli";

export const IS_BASE_ENABLED = process.env.REACT_APP_IS_BASE_ENABLED
  ? process.env.REACT_APP_IS_BASE_ENABLED === "1" || process.env.REACT_APP_IS_BASE_ENABLED === "true"
  : true;

export interface INetwork {
  name: string;
  color: string;
  rpcUrl: string;
  chainId: number;
  blockExplorer: string;
}

export const NETWORKS: Record<AllNetwork, INetwork> = {
  mainnet: {
    name: "mainnet",
    color: "#ff8b9e",
    chainId: 1,
    rpcUrl: `https://mainnet.infura.io/v3/${INFURA_ID}`,
    blockExplorer: "https://etherscan.io/",
  },
  optimism: {
    name: "optimism",
    color: "#f01a37",
    chainId: 10,
    blockExplorer: "https://optimistic.etherscan.io/",
    rpcUrl: `https://optimism-mainnet.infura.io/v3/${INFURA_ID}`,
  },
  "goerli-optimism": {
    name: "goerli-optimism",
    color: "#0975F6",
    chainId: 420,
    blockExplorer: "https://goerli-optimism.etherscan.io/",
    rpcUrl: `https://endpoints.omniatech.io/v1/op/goerli/public`,
  },
  base: {
    name: "base",
    color: "#f01a37",
    chainId: 8453,
    blockExplorer: "https://goerli.basescan.org//",
    rpcUrl: `https://goerli.base.org`,
  },
  "base-goerli": {
    name: "base-goerli",
    color: "#f01a37",
    chainId: 84531,
    blockExplorer: "https://goerli.basescan.org//",
    rpcUrl: `https://goerli.base.org`,
  },
};

export function getNetworkById(chainId: number) {
  return Object.values(NETWORKS).find(network => network.chainId === chainId);
}

export const NETWORK = NETWORKS[process.env.REACT_APP_NETWORK as keyof typeof NETWORKS];

if (NETWORK === undefined) {
  throw new Error("Network not found, please change the `REACT_APP_NETWORK` ENV or add the network to the list");
}

export function getNetwork(network?: Network) {
  if (network === "base") {
    return NETWORK.name.includes("goerli") ? NETWORKS["base-goerli"] : NETWORKS.base;
  }
  return NETWORK;
}
