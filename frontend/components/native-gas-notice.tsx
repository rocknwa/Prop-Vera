"use client";

import { useState } from "react";
import { useAccount } from "@/lib/thirdweb-hooks";
import { CRONOS_TESTNET_FAUCET_URL, useNativeGas } from "@/lib/native-gas";

export function NativeGasNotice() {
  const { address } = useAccount();
  const { balanceLabel, hasInsufficientGas } = useNativeGas();
  const [copyMessage, setCopyMessage] = useState("");

  if (!address || !hasInsufficientGas) return null;

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopyMessage("Address copied — paste it into the faucet.");
    } catch {
      setCopyMessage("Copy failed. Select the full address below to copy it manually.");
    }
  };

  const openFaucet = () => {
    void copyAddress();
    window.open(CRONOS_TESTNET_FAUCET_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <aside className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-2xl rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950 shadow-xl sm:bottom-5 sm:p-5" role="alert" aria-live="polite">
      <div className="flex gap-3">
        <span className="text-xl" aria-hidden="true">⛽</span>
        <div className="min-w-0 flex-1">
          <p className="font-bold">You need test TCRO for gas</p>
          <p className="mt-1 text-sm">Your Cronos Testnet balance is {balanceLabel} TCRO. Get free testnet TCRO before using PropVera write actions, including Get USDC.</p>
          <p className="mt-3 select-all break-all rounded-md bg-white/70 p-2 font-mono text-xs" title="Your full wallet address">{address}</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={openFaucet} className="rounded-md bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800">Get test TCRO</button>
            <button type="button" onClick={() => void copyAddress()} className="rounded-md border border-amber-400 px-4 py-2 text-sm font-semibold hover:bg-amber-100">Copy address</button>
          </div>
          {copyMessage && <p className="mt-2 text-xs font-medium" role="status">{copyMessage}</p>}
          <p className="mt-2 text-xs">After funding, return to this tab. PropVera will check your balance again automatically.</p>
        </div>
      </div>
    </aside>
  );
}
