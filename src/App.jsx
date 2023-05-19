import React, { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useBurnerSigner } from "eth-hooks";

import { NETWORKS } from "./constants";
import { About, Home } from "./views";
import { useStaticJsonRPC } from "./hooks";
import { Account, Footer, Header } from "./components";
import { StackupProvider } from "./contexts/StackupContext";

import "./index.css";
import "./App.css";
import "antd/dist/antd.css";

const network = NETWORKS[process.env.REACT_APP_NETWORK ?? "goerli"];

function App() {
  const provider = useStaticJsonRPC(network.rpcUrl, network.chainId);
  const { signer, loadOrGenerateBurner } = useBurnerSigner(provider);

  useEffect(() => {
    if (!signer && provider) loadOrGenerateBurner();
  }, [loadOrGenerateBurner, provider, signer]);

  const routes = (
    <Routes>
      <Route exact path="/" element={<Home signer={signer} provider={provider} network={network} />} />
      <Route exact path="/about" element={<About />} />
      <Route exact path="/:address" element={<Home signer={signer} provider={provider} network={network} />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );

  return (
    <div className="App">
      <StackupProvider provider={provider} signer={signer}>
        <Header>
          <Account signer={signer} provider={provider} />
        </Header>
        {routes}
        <Footer />
      </StackupProvider>
    </div>
  );
}

export default App;
