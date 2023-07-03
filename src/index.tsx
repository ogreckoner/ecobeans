import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { ConfigProvider } from "antd";

import { Web3AuthProvider } from "@contexts/Web3AuthContext";
import App from "./App";

const queryClient = new QueryClient();
const root = createRoot(document.getElementById("root")!);

root.render(
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={{ token: { colorPrimary: "#021540", colorIcon: "#FFFFFF", colorLink: "#06153c" } }}>
        <Web3AuthProvider>
          <App />
        </Web3AuthProvider>
      </ConfigProvider>
    </QueryClientProvider>
  </BrowserRouter>,
);
