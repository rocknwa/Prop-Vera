"use client";

import { ConnectButton } from "thirdweb/react";
import { cronosTestnet, supportedWallets, thirdwebClient } from "@/lib/thirdweb";

// No `accountAbstraction` prop: thirdweb's bundler/paymaster network doesn't
// cover Cronos Testnet (chain 338), so connected wallets stay regular
// EOA-style signers here (in-app wallets included) rather than smart
// accounts. Users pay their own gas. See MIGRATION_NOTES.md.
export function ConnectButtonClient() {
  return (
    <ConnectButton
      client={thirdwebClient}
      chain={cronosTestnet}
      wallets={supportedWallets}
      connectButton={{ label: "Sign in or connect" }}
    />
  );
}
