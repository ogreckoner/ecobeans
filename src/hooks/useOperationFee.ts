import { BigNumber, ethers } from "ethers";
import { useQuery } from "react-query";

import { round } from "@helpers";
import { parseUnits } from "@helpers/token";
import { getTokenPrice } from "@helpers/market";
import { getTokenInfo, Token } from "@constants";
import { IFlatFees, useFlatFees } from "@hooks/useFlatFees";

export enum FeeOperation {
  Transfer,
  Share,
}

async function getOperationFee(token: Token, operation: FeeOperation, fees: IFlatFees): Promise<BigNumber> {
  if (token === Token.ECO) return fees.eco;
  if (token === Token.USDC) return fees.usdc;

  // Get Prices from Coingecko
  const [ecoPrice, tokenPrice] = await Promise.all([getTokenPrice(Token.ECO), getTokenPrice(token)]);

  const ecoFee = parseUnits(await getOperationFee(Token.ECO, operation, fees));
  // Fees for all other tokens as charged double the fee
  const tokenFee = 2 * ecoFee * ecoPrice * (1 / tokenPrice);
  const { decimals } = getTokenInfo(token);
  return ethers.utils.parseUnits(round(tokenFee, decimals).toString(), decimals);
}

export const useOperationFee = (token: Token, operation: FeeOperation = FeeOperation.Transfer) => {
  const feeData = useFlatFees();
  return useQuery(["operation-fee", token, operation], () => getOperationFee(token, operation, feeData!), {
    enabled: !!feeData.eco,
    refetchInterval: 20_000,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });
};
