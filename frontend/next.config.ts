import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  logging: {
    browserToTerminal: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  turbopack: {},
  // Fix "indexedDB is not defined" during SSR static generation.
  // WalletConnect / @walletconnect/ethereum-provider accesses browser-only
  // storage APIs on module load. The webpack server fallback prevents those
  // modules from being bundled into the Node.js SSR runtime.
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        indexedDB: false,
        localStorage: false,
        sessionStorage: false,
      };
    }
    return config;
  },
};

export default nextConfig;
