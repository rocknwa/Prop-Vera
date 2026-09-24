"use client";

import { useEffect, useRef, useState } from "react";
import { ConnectButton, useActiveAccount, useActiveWallet, useDisconnect } from "thirdweb/react";
import { cronosTestnet, supportedWallets, thirdwebClient } from "@/lib/thirdweb";
import { useNativeGas } from "@/lib/native-gas";

// No `accountAbstraction` prop: thirdweb's bundler/paymaster network doesn't
// cover Cronos Testnet (chain 338), so connected wallets stay regular
// EOA-style signers here (in-app wallets included) rather than smart
// accounts. Users pay their own gas. See MIGRATION_NOTES.md.
export function ConnectButtonClient({ usdcBalance = "0.00" }: { usdcBalance?: string }) {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { disconnect } = useDisconnect();
  const { balanceLabel: tcroBalance, isLoading: isGasLoading } = useNativeGas();
  const [accountOpen, setAccountOpen] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!accountOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) setAccountOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAccountOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [accountOpen]);

  // thirdweb 5.121.4's default *connected* ConnectButton view crashes while
  // resolving its internal AccountName/AccountAvatar context. Keep its proven
  // sign-in modal (and every configured wallet) for the disconnected state,
  // then render our own small connected-state control instead of entering that
  // broken library branch. This does not change the active account used by the
  // rest of the application.
  if (account) {
    const address = account.address;
    const copyAddress = async () => {
      try {
        await navigator.clipboard.writeText(address);
        setCopyMessage("Address copied");
      } catch {
        setCopyMessage("Copy failed — select the address above");
      }
    };

    return (
      <div ref={accountMenuRef} className="relative shrink-0">
        <button
          type="button"
          onClick={() => { setAccountOpen((open) => !open); setCopyMessage(""); }}
          aria-expanded={accountOpen}
          aria-haspopup="dialog"
          className="min-w-32 rounded-lg border border-border bg-background px-3 py-1.5 text-right transition-colors hover:bg-muted/50"
        >
          <span className="block text-xs font-bold text-foreground">
            {isGasLoading ? "Loading TCRO…" : `${tcroBalance} TCRO`}
          </span>
          <span className="block font-mono text-[11px] text-muted">
            {address.slice(0, 6)}…{address.slice(-4)}
          </span>
        </button>

        {accountOpen && (
          <div role="dialog" aria-label="Wallet account" className="absolute right-0 top-full z-[60] mt-2 w-72 rounded-xl border border-border bg-background p-4 text-left shadow-2xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Connected wallet</p>
            <p className="mt-2 select-all break-all rounded-md bg-muted/20 p-2 font-mono text-xs" title={address}>{address}</p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-muted">TCRO balance</dt><dd className="font-semibold">{isGasLoading ? "—" : tcroBalance} TCRO</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">USDC balance</dt><dd className="font-semibold">${usdcBalance} USDC</dd></div>
            </dl>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => void copyAddress()} className="rounded-md border border-border px-3 py-2 text-xs font-semibold hover:bg-muted/50">Copy address</button>
              <button type="button" disabled={!wallet} onClick={() => { if (wallet) disconnect(wallet); setAccountOpen(false); }} className="rounded-md bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50">Disconnect wallet</button>
            </div>
            {copyMessage && <p className="mt-2 text-xs font-medium text-emerald-700" role="status">{copyMessage}</p>}
          </div>
        )}
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
