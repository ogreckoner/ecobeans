import { ethers } from "ethers";
import React, { createContext, Dispatch, Reducer, useContext, useReducer } from "react";

interface IWeb3AuthContext {
  signer?: ethers.Wallet;
  dispatch: Dispatch<Web3AuthAction>;
}

export enum Web3AuthActionType {
  SET_SIGNER,
}

type Web3AuthAction = {
  type: Web3AuthActionType.SET_SIGNER;
  signer: IWeb3AuthContext["signer"];
};

const defaultState: IWeb3AuthContext = {
  // eslint-disable-next-line
  dispatch: {} as Dispatch<Web3AuthAction>,
};

export const Web3AuthContext = createContext<IWeb3AuthContext>(defaultState);

const reducer: Reducer<IWeb3AuthContext, Web3AuthAction> = (state, action) => {
  switch (action.type) {
    case Web3AuthActionType.SET_SIGNER:
      return { ...state, signer: action.signer };
  }
};

export const useWeb3AuthState = () => useContext(Web3AuthContext);

export const Web3AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, defaultState);

  return <Web3AuthContext.Provider value={{ ...state, dispatch }}>{children}</Web3AuthContext.Provider>;
};
