import React, { useContext } from "react";
import { Token } from "@constants";
import { ethers } from "ethers";

interface ITokenContext {
  token: Token;
  balance?: ethers.BigNumber;
  baseBalance?: ethers.BigNumber;
  optimismBalance?: ethers.BigNumber;
}

export const TokenContext = React.createContext<ITokenContext>({
  token: Token.ECO,
});
export const useCurrentToken = () => useContext(TokenContext);
