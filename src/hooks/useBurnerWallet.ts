import { ethers } from "ethers";
import { useState, useEffect } from "react";
import { useBurnerSigner } from "./useBurnerSigner";

export const useBurnerWallet = (): ethers.Wallet | undefined => {
  const { signer: burnerSigner, loadOrGenerateBurner } = useBurnerSigner();

  const [signer, setSigner] = useState<ethers.Wallet>();

  useEffect(() => {
    if (!signer) loadOrGenerateBurner();
  }, [loadOrGenerateBurner, signer]);

  useEffect(() => {
    const getSigner = () => {
      const storedPK = window.localStorage.getItem("metaPrivateKey");
      if (storedPK) {
        try {
          return new ethers.Wallet(storedPK);
        } catch (e) {
          console.warn("stored PK is invalid, using new burner wallet");
        }
      }
      return burnerSigner as ethers.Wallet;
    };
    setSigner(getSigner());
  }, [burnerSigner]);

  return signer;
};
