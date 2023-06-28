import { useMemo } from "react";
import { BigNumber } from "ethers";
import { useContractReader } from "eth-hooks";

import { ERC20__factory } from "@assets/contracts";
import { getTokenInfo, Network, Token } from "@constants";
import { getNetworkProvider } from "@modules/blockchain/providers";

export const useBalance = (token: Token, address: string, network: Network = "optimism") => {
  const tokenContract = useMemo(() => {
    const provider = getNetworkProvider(network);
    return ERC20__factory.connect(getTokenInfo(token, network).address, provider);
  }, [token, network]);

  const [balance, , status] = useContractReader(
    tokenContract,
    tokenContract.balanceOf,
    [address],
    {},
    { blockNumberInterval: 1 },
  );

  return { balance: balance as BigNumber | undefined, status };
};
