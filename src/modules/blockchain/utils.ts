import { Network } from "@constants";

export function isBaseNetwork(network: Network | number) {
  return network === "base" || network === 8453 || network === 84531;
}
