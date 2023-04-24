import React, { useCallback, useEffect, useState } from "react";
import { Route, Switch } from "react-router-dom";
import { ethers } from "ethers";
import { useUserProviderAndSigner } from "eth-hooks";

import "./App.css";

import { Home } from "./views";
import { useStaticJsonRPC } from "./hooks";
import { Account, Header } from "./components";
import { NETWORKS } from "./constants";
import { Web3ModalSetup } from "./helpers";

import "antd/dist/antd.css";

/// 📡 What chain are your contracts deployed to?

const web3Modal = Web3ModalSetup();

const initialNetwork = NETWORKS[process.env.REACT_APP_NETWORK ?? "goerli"];
const selectedNetwork = initialNetwork.name;
const targetNetwork = NETWORKS[selectedNetwork];
const RPC_URL = process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : targetNetwork.rpcUrl;

function App() {
  const [address, setAddress] = useState();
  const [showSettings, setShowSettings] = useState(false);
  const [injectedProvider, setInjectedProvider] = useState();

  const localProvider = useStaticJsonRPC([RPC_URL]);

  const logoutOfWeb3Modal = useCallback(async () => {
    await web3Modal.clearCachedProvider();
    if (injectedProvider && injectedProvider.provider && typeof injectedProvider.provider.disconnect == "function") {
      await injectedProvider.provider.disconnect();
    }
    setTimeout(() => window.location.reload(), 1);
  }, [injectedProvider]);

  const { signer: userSigner } = useUserProviderAndSigner(injectedProvider, localProvider, true);

  useEffect(() => {
    async function getAddress() {
      if (userSigner) {
        const newAddress = await userSigner.getAddress();
        setAddress(newAddress);
      }
    }

    getAddress();
  }, [userSigner]);

  const loadWeb3Modal = useCallback(async () => {
    //const provider = await web3Modal.connect();
    const provider = await web3Modal.requestProvider();
    setInjectedProvider(new ethers.providers.Web3Provider(provider));

    provider.on("chainChanged", chainId => {
      console.log(`chain changed to ${chainId}! updating providers`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    provider.on("accountsChanged", () => {
      console.log(`account changed!`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    // Subscribe to session disconnection
    provider.on("disconnect", (code, reason) => {
      console.log(code, reason);
      logoutOfWeb3Modal();
    });
  }, [logoutOfWeb3Modal]);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
    //automatically connect if it is a safe app
    const checkSafeApp = async () => {
      if (await web3Modal.isSafeApp()) {
        loadWeb3Modal();
      }
    };
    checkSafeApp();
  }, [loadWeb3Modal]);

  return (
    <div className="App">
      <Header>
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", flex: 1 }}>
            <Account address={address} userSigner={userSigner} localProvider={localProvider} />
            <div
              onClick={() => setShowSettings(!showSettings)}
              style={{
                cursor: "pointer",
                fontSize: 18,
                paddingTop: 4,
                paddingLeft: 8,
              }}
            />
          </div>
        </div>
      </Header>
      <Switch>
        <Route exact path="/">
          <Home address={address} userSigner={userSigner} localProvider={localProvider} network={targetNetwork} />
        </Route>
        <Route exact path="/:address">
          <Home address={address} userSigner={userSigner} localProvider={localProvider} network={targetNetwork} />
        </Route>
      </Switch>

      <div style={{ zIndex: -1, padding: 64, opacity: 0.5, fontSize: 12 }}>
        created by <a href="https://eco.org">eco</a> with{" "}
        <a href="https://github.com/austintgriffith/scaffold-eth#-scaffold-eth" target="_blank" rel="noreferrer">
          scaffold-eth
        </a>
      </div>
      <div style={{ padding: 32 }} />
    </div>
  );
}

export default App;
