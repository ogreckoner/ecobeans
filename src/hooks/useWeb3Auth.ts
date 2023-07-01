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

import { NETWORK } from "@constants";
import { useWeb3AuthState, Web3AuthActionType } from "@contexts/Web3AuthContext";
import { PRIVATE_KEY_LOCAL_STORAGE_KEY } from "@hooks/useBurnerWallet";
import { AuthMethod, VERIFIER_MAP, WEB3_AUTH_CLIENT_ID } from "@constants/web3auth";

const isTestnet = NETWORK.chainId === 420;
const SECURITY_QUESTION = "What is your password?";

const webStorageModule = new WebStorageModule();
const securityQuestionsModule = new SecurityQuestionsModule();
const privateKeyModule = new PrivateKeyModule([new SECP256K1Format(new BN(0))]);
const storageLayer = new TorusStorageLayer({
  hostUrl: "https://metadata.tor.us",
});

const serviceProvider = new TorusServiceProvider({
  customAuthArgs: {
    network: "cyan",
    web3AuthClientId: WEB3_AUTH_CLIENT_ID,
    enableLogging: isTestnet,
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

  const login = async (method: AuthMethod, reconstruct = false) => {
    if (!isTorusServiceProvider(tKey.serviceProvider)) {
      throw new Error("Invalid service provider");
    }

    await tKey.serviceProvider.triggerLogin(VERIFIER_MAP[method]);
    await tKey.initialize();

    if (reconstruct) {
      try {
        await getShareFromStorage();
      } catch (err) {
        await tKey._initializeNewKey({ initializeModules: true });
      }
      await tKey.reconstructKey();
    }
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
      await tKey.initialize();

      const privateKeyModule = tKey.modules.privateKey as PrivateKeyModule;
      const securityQuestionsModule = tKey.modules.securityQuestions as SecurityQuestionsModule;

      if (answer) {
        let question: string | undefined;
        try {
          question = securityQuestionsModule.getSecurityQuestions();
        } catch (err) {
          console.warn("Question not found", err);
        }

        if (question) {
          await securityQuestionsModule.changeSecurityQuestionAndAnswer(answer, SECURITY_QUESTION);
        } else {
          await securityQuestionsModule.generateNewShareWithSecurityQuestions(answer, SECURITY_QUESTION);
        }
      }

      let privateKey;
      try {
        privateKey = await getPrivateKeys();
      } catch (error) {
        console.log("[getPrivateKeys:error]", error);
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
    const privateKey = await getPrivateKeys();
    if (!privateKey) throw new Error("Unable to reconstruct - no key stored");
    const wallet = new ethers.Wallet(privateKey);
    saveToLocalstorage(wallet.privateKey);
    dispatch({ type: Web3AuthActionType.SET_SIGNER, signer: wallet });
  };

  const answerSecurityQuestions = async (answer: string) => {
    const securityQuestionsModule = tKey.modules.securityQuestions as SecurityQuestionsModule;
    await securityQuestionsModule.inputShareFromSecurityQuestions(answer);
    await tKey.reconstructKey();
  };

  return { login, save, reconstruct, answerSecurityQuestions, getShareFromStorage, signer };
};
