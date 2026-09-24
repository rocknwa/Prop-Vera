"use client";

import { ConnectButton, useActiveAccount, useActiveWallet, useDisconnect } from "thirdweb/react";
import { cronosTestnet, supportedWallets, thirdwebClient } from "@/lib/thirdweb";
import { useNativeGas } from "@/lib/native-gas";

// No `accountAbstraction` prop: thirdweb's bundler/paymaster network doesn't
// cover Cronos Testnet (chain 338), so connected wallets stay regular
// EOA-style signers here (in-app wallets included) rather than smart
// accounts. Users pay their own gas. See MIGRATION_NOTES.md.
export function ConnectButtonClient() {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { disconnect } = useDisconnect();
  const { balanceLabel, isLoading: isGasLoading } = useNativeGas();

  // thirdweb 5.121.4's default *connected* ConnectButton view crashes while
  // resolving its internal AccountName/AccountAvatar context. Keep its proven
  // sign-in modal (and every configured wallet) for the disconnected state,
  // then render our own small connected-state control instead of entering that
  // broken library branch. This does not change the active account used by the
  // rest of the application.
  if (account) {
    const address = account.address;
    return (
      <div className="flex items-center gap-2">
        <div className="hidden text-right sm:block">
          <span className="block max-w-36 truncate font-mono text-xs text-muted" title={address}>
            {address.slice(0, 6)}…{address.slice(-4)}
          </span>
          <span className="block text-xs font-semibold text-foreground">
            {isGasLoading ? "Loading TCRO…" : `${balanceLabel} TCRO`}
          </span>
        </div>
        <button
          type="button"
          disabled={!wallet}
          onClick={() => wallet && disconnect(wallet)}
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted/50 disabled:opacity-50"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <ConnectButton
      client={thirdwebClient}
      chain={cronosTestnet}
      wallets={supportedWallets}
      connectButton={{ label: "Sign in or connect" }}
    />
  );
}
