"use client";

import { ReactNode, useEffect, useState } from "react";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

// Lazy load wagmi config to prevent server-side indexedDB access
let wagmiConfig: any = null;

async function getWagmiConfig() {
  if (wagmiConfig) return wagmiConfig;
  const { config } = await import("@/lib/wagmi");
  wagmiConfig = config;
  return config;
}

export function Providers({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getWagmiConfig().then((cfg) => {
      setConfig(cfg);
      setIsLoading(false);
    });
  }, []);

  if (isLoading || !config) {
    return <>{children}</>;
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
