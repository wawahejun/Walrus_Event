import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./wallet.css";
import { WalletProviderWrapper } from "./components/wallet/wallet-provider.tsx";
import '@mysten/dapp-kit/dist/index.css';

createRoot(document.getElementById("root")!).render(
  <WalletProviderWrapper>
    <App />
  </WalletProviderWrapper>
);