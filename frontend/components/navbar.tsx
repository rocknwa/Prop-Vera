"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ConnectButtonClient } from "./connect-button-client";
import { cn } from "@/lib/utils";
import { PROPVERA_CONTRACT_ADDRESS, PROPVERA_ABI, MOCK_USDC_ADDRESS, MOCK_USDC_ABI } from "@/lib/contracts";
import { useEffect, useState } from "react";

export function Navbar() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [mintMessage, setMintMessage] = useState("");

  useEffect(() => { setMounted(true); }, []);

  const { data: isAdmin } = useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS,
    abi: PROPVERA_ABI,
    functionName: "isAdmin",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: contractOwner } = useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS,
    abi: PROPVERA_ABI,
    functionName: "owner",
    query: { enabled: !!address },
  });

  const { data: isSeller } = useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS,
    abi: PROPVERA_ABI,
    functionName: "sellers",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: usdcBalance, refetch: refetchUSDC } = useReadContract({
    address: MOCK_USDC_ADDRESS,
    abi: MOCK_USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10_000 },
  });

  const { writeContract, data: mintHash, isPending: isMinting } = useWriteContract();
  const { isSuccess: mintSuccess } = useWaitForTransactionReceipt({ hash: mintHash });

  useEffect(() => {
    if (mintSuccess) {
      refetchUSDC();
      setMintMessage("✓ 10,000 USDC added!");
      setTimeout(() => setMintMessage(""), 3000);
    }
  }, [mintSuccess, refetchUSDC]);

  const handleMintUSDC = () => {
    if (!address) return;
    writeContract({
      address: MOCK_USDC_ADDRESS,
      abi: MOCK_USDC_ABI,
      functionName: "mint",
      args: [address, 10000n],
    });
  };

  const isOwner = mounted && address && contractOwner
    ? address.toLowerCase() === (contractOwner as string).toLowerCase()
    : false;

  const showAdmin = mounted && isConnected && (isAdmin || isOwner);

  const usdcFormatted = usdcBalance
    ? (Number(usdcBalance) / 1_000_000).toFixed(2)
    : "0.00";

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/marketplace", label: "Marketplace" },
    { href: "/fractional", label: "Fractional" },
    { href: "/share-market", label: "Shares" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/seller", label: "Seller" },
    ...(showAdmin ? [{ href: "/admin", label: "⚡ Admin" }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
      <nav className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full gap-3">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-lg">P</span>
          </div>
          <span className="text-lg font-bold hidden sm:inline">PropVera</span>
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
                pathname === item.href
                  ? "bg-primary/10 text-primary"
                  : "text-foreground hover:bg-muted/50"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {mounted && isConnected && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted hidden md:inline font-medium">
                ${usdcFormatted} USDC
              </span>
              <button
                onClick={handleMintUSDC}
                disabled={isMinting}
                title="Mint 10,000 test USDC to your wallet"
                className="px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {isMinting ? "Minting..." : mintMessage || "🪙 Get USDC"}
              </button>
            </div>
          )}
          <ConnectButtonClient />
        </div>
      </nav>
    </header>
  );
}
