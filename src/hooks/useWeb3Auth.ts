import { useEffect } from "react";
import { ethers } from "ethers";
import BN from "bn.js";

import ThresholdKey from "@tkey/default";
import WebStorageModule from "@tkey/web-storage";
import TorusStorageLayer from "@tkey/storage-layer-torus";
import SecurityQuestionsModule from "@tkey/security-questions";
import TorusServiceProvider from "@tkey/service-provider-torus";
import PrivateKeyModule, { SECP256K1Format } from "@tkey/private-keys";
import { IServiceProvider } from "@tkey/common-types";
import { SubVerifierDetails } from "@toruslabs/customauth";

import { NETWORK } from "@constants";
import { useWeb3AuthState, Web3AuthActionType } from "@contexts/Web3AuthContext";
import { PRIVATE_KEY_LOCAL_STORAGE_KEY } from "@hooks/useBurnerWallet";

const isTestnet = NETWORK.chainId === 420;
const AUTH_DOMAIN = isTestnet ? "https://torus-test.auth0.com" : "https://torus.auth0.com";
const web3AuthClientId = "BIlPvlyyNE2PV19so5uecrPqlutXHSZ0U7dzeFgRjIddtSDjF3orPX6v5AjRu-Jas82oZinFiX9drIK1K8zuDwo";

export const SECURITY_QUESTION = "What is your password?";

export enum AuthMethod {
  GOOGLE = "google",
  TWITTER = "twitter",
}

const verifierMap: Record<AuthMethod, SubVerifierDetails> = {
  [AuthMethod.GOOGLE]: {
    typeOfLogin: "google",
    verifier: "web3auth-testnet-verifier",
    clientId: "134678854652-vnm7amoq0p23kkpkfviveul9rb26rmgn.apps.googleusercontent.com",
  },
  [AuthMethod.TWITTER]: {
    typeOfLogin: "twitter",
    verifier: "torus-auth0-twitter-lrc",
    clientId: "A7H8kkcmyFRlusJQ9dZiqBLraG2yWIsO",
    jwtParams: { domain: AUTH_DOMAIN },
  },
};

const webStorageModule = new WebStorageModule();
const securityQuestionsModule = new SecurityQuestionsModule();
const privateKeyModule = new PrivateKeyModule([new SECP256K1Format(new BN(0))]);
const storageLayer = new TorusStorageLayer({
  hostUrl: "https://metadata.tor.us",
});

const serviceProvider = new TorusServiceProvider({
  customAuthArgs: {
    web3AuthClientId,
    enableLogging: isTestnet,
    network: isTestnet ? "testnet" : "mainnet",
    baseUrl: `${window.location.origin}/serviceworker`,
  },
});

const tKey = new ThresholdKey({
  serviceProvider,
  storageLayer,
  modules: {
    privateKey: privateKeyModule,
    webStorage: webStorageModule,
    securityQuestions: securityQuestionsModule,
  },
});

console.log("tKey", tKey);

function isTorusServiceProvider(provider: IServiceProvider): provider is TorusServiceProvider {
  return "directWeb" in provider;
}

export const useWeb3Auth = () => {
  const { signer, dispatch } = useWeb3AuthState();

  useEffect(() => {
    const init = async () => {
      // Init Service Provider
      try {
        await serviceProvider.init({ skipSw: true });
      } catch (error) {
        console.error(error);
      }
    };
    init();
  }, []);

  const saveToLocalstorage = (privateKey: string) => {
    const currentPrivateKey = window.localStorage.getItem("metaPrivateKey");
    if (currentPrivateKey) {
      window.localStorage.setItem(`${PRIVATE_KEY_LOCAL_STORAGE_KEY}_backup` + Date.now(), currentPrivateKey);
    }

    try {
      window.localStorage.setItem(PRIVATE_KEY_LOCAL_STORAGE_KEY, privateKey);
    } catch (e) {
      console.log("[saveToLocalstorage:error]", e);
    }
  };

  const getShareFromStorage = () => {
    const webStorageModule = tKey.modules["webStorage"] as WebStorageModule;
    return webStorageModule.inputShareFromWebStorage();
  };

  const login = async (method: AuthMethod) => {
    if (!isTorusServiceProvider(tKey.serviceProvider)) {
      throw new Error("Invalid service provider");
    }

    await tKey.serviceProvider.triggerLogin(verifierMap[method]);
    await tKey.initialize();

    // await tKey.reconstructKey();
  };

  const getPrivateKeys = async () => {
    try {
      await getShareFromStorage();
    } catch (err) {
      console.warn("[getPrivateKeys:warn] failed trying to get share from local storage");
    }

    await tKey.reconstructKey();

    const privateKeyModule = tKey.modules.privateKey as PrivateKeyModule;
    const keys = await privateKeyModule.getPrivateKeys();
    const secp256k1nKeys = keys.filter(key => key.type === "secp256k1n");
    if (secp256k1nKeys.length) {
      const { privateKey } = secp256k1nKeys[secp256k1nKeys.length - 1];
      return privateKey.toString("hex");
    } else {
      return null;
    }
  };

  const save = async (wallet: ethers.Wallet, answer?: string) => {
    try {
      const privateKeyModule = tKey.modules.privateKey as PrivateKeyModule;
      const securityQuestionsModule = tKey.modules.securityQuestions as SecurityQuestionsModule;

      let question: string | undefined;
      try {
        question = securityQuestionsModule.getSecurityQuestions();
      } catch (err) {
        console.warn("Question not found", err);
      }

      if (!question && answer) {
        await securityQuestionsModule.generateNewShareWithSecurityQuestions(SECURITY_QUESTION, answer);
      }

      let privateKey;
      try {
        privateKey = await getPrivateKeys();
      } catch (error) {
        console.log("error", error);
      }

      const pkBn = new BN(wallet.privateKey.slice(2), "hex");
      if (pkBn.toString("hex") !== privateKey) {
        await privateKeyModule.setPrivateKey("secp256k1n", pkBn);
        saveToLocalstorage(wallet.privateKey);
      } else {
        console.warn("already saved - skipping");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const reconstruct = async () => {
    try {
      const privateKey = await getPrivateKeys();
      if (privateKey) {
        const signer = new ethers.Wallet(privateKey);
        dispatch({ type: Web3AuthActionType.SET_SIGNER, signer });
      } else {
        console.warn("There is not a private key to reconstruct");
      }
    } catch (error) {
      console.error("[reconstruct:error]", error);
    }
  };

  const answerSecurityQuestions = async (answer: string) => {
    const securityQuestionsModule = tKey.modules.securityQuestions as SecurityQuestionsModule;
    await securityQuestionsModule.inputShareFromSecurityQuestions(answer);
    await tKey.reconstructKey();
  };

  return { login, save, reconstruct, answerSecurityQuestions, getShareFromStorage, signer };
};
