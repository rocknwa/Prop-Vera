"use client";

import { ConnectButton } from "thirdweb/react";
import {
  accountAbstraction,
  cronosTestnet,
  supportedWallets,
  thirdwebClient,
} from "@/lib/thirdweb";

export function ConnectButtonClient() {
  return (
    <ConnectButton
      client={thirdwebClient}
      chain={cronosTestnet}
      wallets={supportedWallets}
      accountAbstraction={accountAbstraction}
      connectButton={{ label: "Sign in or connect" }}
    />
  );
}
