import { createThirdwebClient, defineChain } from "thirdweb";
import { createWallet, inAppWallet } from "thirdweb/wallets";

/** The chain used by both the UI and every contract helper. */
export const cronosTestnet = defineChain({
  id: 338,
  name: "Cronos Testnet",
  nativeCurrency: { name: "Cronos", symbol: "TCRO", decimals: 18 },
  rpc: "https://evm-t3.cronos.org",
  blockExplorers: [
    { name: "Cronos Testnet Explorer", url: "https://explorer.cronos.org/testnet" },
  ],
  testnet: true,
});

export const thirdwebClient = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

// Keep wallet users alongside the email/Google onboarding path. WalletConnect
// is supplied by thirdweb's wallet ecosystem and no longer needs a separate
// WalletConnect project id in this application.
export const supportedWallets = [
  inAppWallet({ auth: { options: ["email", "google"] } }),
  createWallet("io.metamask"),
  createWallet("walletConnect"),
  createWallet("com.coinbase.wallet"),
  createWallet("io.rabby"),
];

// Account abstraction intentionally omitted: thirdweb's bundler/paymaster
// infrastructure does not cover Cronos Testnet (chain 338) — only Cronos
// zkEVM (240/388), a different chain. Connected wallets, including in-app
// (email/Google) ones, act as normal signer wallets and pay their own gas.
// See MIGRATION_NOTES.md for the earlier "Failed to connect to Smart
// Account" issue this resolves.
