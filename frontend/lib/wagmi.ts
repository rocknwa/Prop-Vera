'use client';

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { cronosTestnet } from 'wagmi/chains';
import { http } from "wagmi"

export const config = getDefaultConfig({
  appName: "PropVera",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains: [cronosTestnet],
  transports: {
    [cronosTestnet.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
 

