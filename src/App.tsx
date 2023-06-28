import React from "react";
import { Navigate, Route } from "react-router-dom";

import { Token } from "@constants";
import { useBurnerWallet } from "@hooks";
import { About, Claim, Home } from "@views";
import { Account, Footer, Header } from "@components";
import { FunWalletProvider } from "@contexts/FunWalletContext";
import { FadeTransitionRoutes } from "@components/routes/FadeTransitionRoutes";

import "./App.css";
import "antd/dist/reset.css";

function App() {
  const signer = useBurnerWallet();
  if (!signer) return null;

  const routes = (
    <FadeTransitionRoutes>
      <Route path="/t/eco" element={<Home token={Token.ECO} />} />
      <Route path="/t/usdc" element={<Home token={Token.USDC} />} />

      {/*--- Redirect Existing Links to new claim route ---*/}
      <Route path="/claim" element={<Claim />} />

      <Route path="/about" element={<About />} />
      <Route path="*" element={<Navigate to="/t/eco" state={{ redirect: true }} />} />
    </FadeTransitionRoutes>
  );

  return (
    <div className="App">
      <FunWalletProvider signer={signer}>
        <Header>
          <Account signer={signer} />
        </Header>
        {routes}
        <Footer />
      </FunWalletProvider>
    </div>
  );
}

export default App;
