import React, { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useUserProviderAndSigner } from "eth-hooks";

import { NETWORKS } from "./constants";
import { About, Home } from "./views";
import { useStaticJsonRPC } from "./hooks";
import { Account, Header, Footer } from "./components";

import "./index.css";
import "./App.css";
import "antd/dist/antd.css";

const initialNetwork = NETWORKS[process.env.REACT_APP_NETWORK ?? "goerli"];
const selectedNetwork = initialNetwork.name;
const targetNetwork = NETWORKS[selectedNetwork];
const RPC_URL = process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : targetNetwork.rpcUrl;

function App() {
  const [address, setAddress] = useState();

  const localProvider = useStaticJsonRPC([RPC_URL]);

  const { signer: userSigner } = useUserProviderAndSigner(undefined, localProvider, true);
  useEffect(() => {
    userSigner?.getAddress().then(address => address && setAddress(address));
  }, [userSigner]);

  const routes = (
    <Routes>
      <Route
        exact
        path="/"
        element={
          <Home address={address} userSigner={userSigner} localProvider={localProvider} network={targetNetwork} />
        }
      />
      <Route exact path="/about" element={<About />} />
      <Route
        exact
        path="/:address"
        element={
          <Home address={address} userSigner={userSigner} localProvider={localProvider} network={targetNetwork} />
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );

  return (
    <div className="App">
      <Header>
        <Account address={address} userSigner={userSigner} localProvider={localProvider} />
      </Header>
      {address ? routes : <div style={{ height: 800 }} />}
      <Footer />
    </div>
  );
}

export default App;
