import { BytesLike, ethers, Wallet } from "ethers";
import { useCallback, useEffect, useRef, useState } from "react";
import { TBurnerSigner } from "eth-hooks";

const storageKey = "scaffold-eth-burner-privateKey";

const isValidPk = (pk: BytesLike | undefined | null): boolean => {
  return pk?.length === 64 || pk?.length === 66;
};

const saveBurnerKeyToStorage = (incomingPK: BytesLike): void => {
  if (isValidPk(incomingPK)) {
    const rawPK = incomingPK;
    window.history.pushState({}, "", "/");
    const currentPrivateKey = window.localStorage.getItem(storageKey);
    if (currentPrivateKey && currentPrivateKey !== rawPK) {
      window.localStorage.setItem(`${storageKey}_backup${Date.now()}`, currentPrivateKey);
      console.log("🔑 ...Saved Private Key");
    }
    window.localStorage.setItem(`${storageKey}`, rawPK.toString());
  }
};

const loadBurnerKeyFromStorage = (): string | null => {
  return window.localStorage.getItem(storageKey);
};

export const useBurnerSigner = (): TBurnerSigner => {
  const [signer, setSigner] = useState<Wallet>();
  const [privateKeyValue, setPrivateKey] = useState<BytesLike>();

  const creatingBurnerRef = useRef(false);
  const account = signer?.address;

  const setValue = (value: string): void => {
    try {
      setPrivateKey(value);
      window.localStorage.setItem(storageKey, value);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const storedKey = window.localStorage.getItem(storageKey);
    if (!storedKey) {
      console.log("generating a new key");
      const newWallet = ethers.Wallet.createRandom();
      const newKey = newWallet.privateKey;
      setValue(newKey);
    } else {
      setValue(storedKey);
    }
  }, []);

  useEffect(() => {
    if (privateKeyValue) {
      setSigner(new ethers.Wallet(privateKeyValue));
    }
  }, [privateKeyValue]);

  const saveToStorage = useCallback(() => {
    console.log("🔑 Incoming Private Key...");
    if (privateKeyValue !== null) {
      saveBurnerKeyToStorage(privateKeyValue as BytesLike);
    }
  }, [privateKeyValue]);

  const generateBurnerSigner = useCallback(() => {
    if (!creatingBurnerRef.current) {
      creatingBurnerRef.current = true;
      console.log("🔑 Create new burner wallet...");
      const wallet = Wallet.createRandom();
      setPrivateKey(() => {
        console.log("📝 ...Set key");
        creatingBurnerRef.current = false;
        return wallet.privateKey;
      });
    } else {
      console.log("⚠ Could not create burner wallet");
    }
  }, []);

  /**
   * Load burner key from storage
   */
  const loadOrGenerateBurner = useCallback(() => {
    if (setPrivateKey != null) {
      const pk = loadBurnerKeyFromStorage();
      if (pk && isValidPk(pk)) {
        console.log("🔑 ...Loaded Private Key");
        setPrivateKey(pk);
      } else {
        generateBurnerSigner();
      }
    }
  }, [generateBurnerSigner]);

  const getBurnerPrivateKey = (): BytesLike | undefined => privateKeyValue;

  return {
    signer,
    account,
    saveBurner: saveToStorage,
    loadOrGenerateBurner,
    generateBurnerSigner,
    getBurnerPrivateKey,
  };
};
