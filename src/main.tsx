import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { config } from "./wagmi_config";
import "./index.css";
import { AppThemeProvider } from "./ThemeContext";
import AppWithRainbow from "./AppWithRainbow";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <AppThemeProvider>
        <AppWithRainbow />
      </AppThemeProvider>
    </QueryClientProvider>
  </WagmiProvider>
);
