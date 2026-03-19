'use client';

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";

// Polkadot Hub Testnet Configuration (Chain ID: 420420417)
const polkadotHubTestnet = {
  id: 420420417,
  name: "Polkadot Hub Testnet",
  network: "polkadot-hub-testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Polkadot",
    symbol: "DOT",
  },
  rpcUrls: {
    public: { http: ["https://services.polkadothub-rpc.com/testnet"] },
    default: { http: ["https://services.polkadothub-rpc.com/testnet"] },
  },
  blockExplorers: {
    default: {
      name: "Polkadot Hub Testnet Explorer",
      url: "https://blockscout-testnet.polkadot.io",
      apiUrl: "https://blockscout-testnet.polkadot.io/api",
    },
  },
  testnet: true,
} as const;

export const config = getDefaultConfig({
  appName: "PropVera",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "test-project",
  chains: [polkadotHubTestnet as any],
  transports: {
    [polkadotHubTestnet.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
