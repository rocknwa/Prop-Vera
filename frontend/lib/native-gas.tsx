"use client";

import { useQuery } from "@tanstack/react-query";
import { createContext, ReactNode, useContext, useEffect } from "react";
import { createPublicClient, formatEther, http, parseEther } from "viem";
import { useAccount } from "./thirdweb-hooks";
import { cronosTestnet } from "./thirdweb";

export const CRONOS_TESTNET_FAUCET_URL = "https://faucet.cronos.com/";
export const MINIMUM_GAS_BALANCE = parseEther("0.01");

const cronosPublicClient = createPublicClient({
  transport: http(cronosTestnet.rpc),
});

type NativeGasContextValue = {
  balance?: bigint;
  balanceLabel: string;
  hasInsufficientGas: boolean;
  isLoading: boolean;
  refetch: () => void;
};

const NativeGasContext = createContext<NativeGasContextValue | undefined>(undefined);

function formatTCROBalance(balance?: bigint) {
  if (balance === undefined) return "—";
  if (balance > 0n && balance < 1_000_000_000_000n) return "<0.000001";
  return Number(formatEther(balance)).toLocaleString(undefined, { maximumFractionDigits: 6 });
}

export function NativeGasProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const balanceQuery = useQuery({
    queryKey: ["native-balance", cronosTestnet.id, address],
    enabled: Boolean(address),
    queryFn: () => cronosPublicClient.getBalance({ address: address! }),
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
    staleTime: 0,
  });

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible" && address) balanceQuery.refetch();
    };
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [address, balanceQuery.refetch]);

  const balance = balanceQuery.data;
  const value = {
    balance,
    balanceLabel: formatTCROBalance(balance),
    hasInsufficientGas: isConnected && balance !== undefined && balance < MINIMUM_GAS_BALANCE,
    isLoading: isConnected && balanceQuery.isLoading,
    refetch: () => { void balanceQuery.refetch(); },
  };

  return <NativeGasContext.Provider value={value}>{children}</NativeGasContext.Provider>;
}

export function useNativeGas() {
  const context = useContext(NativeGasContext);
  if (!context) throw new Error("useNativeGas must be used inside NativeGasProvider");
  return context;
}
