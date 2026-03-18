import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { createConfig, http } from "wagmi";

// Polkadot Hub Testnet Configuration
const polkadotHubTestnet = {
  id: 5135,
  name: "Polkadot Hub Testnet",
  network: "polkadot-hub-testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Testnet Token",
    symbol: "TEST",
  },
  rpcUrls: {
    public: { http: ["https://testnet-rpc.polkadot.io"] },
    default: { http: ["https://testnet-rpc.polkadot.io"] },
  },
  blockExplorers: {
    default: {
      name: "Polkadot Explorer",
      url: "https://testnet.polkadot.io",
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
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
