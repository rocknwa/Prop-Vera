import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { createConfig, http } from "wagmi";

// Polkadot Hub Testnet Configuration (Chain ID: 420420417)
const polkadotHubTestnet = {
  id: 420420417,
  name: "Polkadot Hub Testnet",
  network: "polkadot-hub-testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Polkadot",
    symbol: "POL",
  },
  rpcUrls: {
    public: { http: ["https://rpc.testnet.immutable.com"] },
    default: { http: ["https://rpc.testnet.immutable.com"] },
  },
  blockExplorers: {
    default: {
      name: "Polkadot Hub Explorer",
      url: "https://explorer.testnet.immutable.com",
    },
  },
  testnet: true,
} as const;

export const config = getDefaultConfig({
  appName: "PropVera",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "default",
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
