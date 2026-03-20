"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ConnectButtonClient } from "./connect-button-client";
import { cn } from "@/lib/utils";
import { PROPVERA_CONTRACT_ADDRESS, PROPVERA_ABI, MOCK_USDC_ADDRESS, MOCK_USDC_ABI, USDC_FAUCET_ADDRESS, USDC_FAUCET_ABI } from "@/lib/contracts";
import { useEffect, useState } from "react";

// ── Icons (inline SVG — no extra deps) ──────────────────────────────────────
const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6"  x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);
const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6"  x2="6"  y2="18" />
    <line x1="6"  y1="6"  x2="18" y2="18" />
  </svg>
);
const HomeIcon     = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><polyline points="9 21 9 12 15 12 15 21"/></svg>;
const StoreIcon    = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;
const PieIcon      = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>;
const ArrowsIcon   = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>;
const DashIcon     = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
const TagIcon      = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>;
const ShieldIcon   = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const CoinIcon     = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>;

export function Navbar() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mintMessage, setMintMessage] = useState("");

  useEffect(() => { setMounted(true); }, []);

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const { data: isAdmin } = useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS, abi: PROPVERA_ABI, functionName: "isAdmin",
    args: address ? [address] : undefined, query: { enabled: !!address },
  });
  const { data: contractOwner } = useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS, abi: PROPVERA_ABI, functionName: "owner",
    query: { enabled: !!address },
  });
  const { data: usdcBalance, refetch: refetchUSDC } = useReadContract({
    address: MOCK_USDC_ADDRESS, abi: MOCK_USDC_ABI, functionName: "balanceOf",
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
    writeContract({ address: USDC_FAUCET_ADDRESS, abi: USDC_FAUCET_ABI, functionName: "drip" });
  };

  const isOwner = mounted && address && contractOwner
    ? address.toLowerCase() === (contractOwner as string).toLowerCase() : false;
  const showAdmin = mounted && isConnected && (isAdmin || isOwner);

  const usdcFormatted = usdcBalance ? (Number(usdcBalance) / 1_000_000).toFixed(2) : "0.00";

  const navItems = [
    { href: "/",            label: "Home",        icon: <HomeIcon /> },
    { href: "/marketplace", label: "Marketplace", icon: <StoreIcon /> },
    { href: "/fractional",  label: "Fractional",  icon: <PieIcon /> },
    { href: "/share-market",label: "Shares",      icon: <ArrowsIcon /> },
    { href: "/dashboard",   label: "Dashboard",   icon: <DashIcon /> },
    { href: "/seller",      label: "Seller",      icon: <TagIcon /> },
    ...(showAdmin ? [{ href: "/admin", label: "Admin", icon: <ShieldIcon /> }] : []),
  ];

  return (
    <>
      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
        <nav className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full gap-3">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-lg font-bold hidden sm:inline">PropVera</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
                  pathname === item.href ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/50"
                )}>
                <span className={pathname === item.href ? "text-primary" : "text-muted"}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            {/* USDC balance + mint — desktop only */}
            {mounted && isConnected && (
              <div className="hidden md:flex items-center gap-2">
                <span className="text-xs text-muted font-medium">${usdcFormatted} USDC</span>
                <button onClick={handleMintUSDC} disabled={isMinting}
                  title="Mint 10,000 test USDC"
                  className="px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors whitespace-nowrap">
                  {isMinting ? "Minting..." : mintMessage || "🪙 Get USDC"}
                </button>
              </div>
            )}

            {/* Wallet connect */}
            <ConnectButtonClient />

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden flex items-center justify-center h-9 w-9 rounded-md border border-border text-foreground hover:bg-muted/50 transition-colors"
              aria-label="Open menu">
              <MenuIcon />
            </button>
          </div>
        </nav>
      </header>

      {/* ── Mobile drawer overlay ───────────────────────────────────────────── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Mobile drawer panel ─────────────────────────────────────────────── */}
      <div className={cn(
        "fixed top-0 right-0 z-50 h-full w-72 bg-background border-l border-border shadow-2xl flex flex-col lg:hidden",
        "transition-transform duration-300 ease-in-out",
        drawerOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-bold text-base">PropVera</span>
          </div>
          <button onClick={() => setDrawerOpen(false)}
            className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted/50 transition-colors text-muted"
            aria-label="Close menu">
            <CloseIcon />
          </button>
        </div>

        {/* Wallet info block */}
        {mounted && isConnected && (
          <div className="mx-4 mt-4 p-4 rounded-xl bg-muted/20 border border-border space-y-3">
            {/* Address */}
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
              <p className="text-xs text-muted font-mono truncate">
                {address?.slice(0, 8)}...{address?.slice(-6)}
              </p>
            </div>
            {/* USDC balance */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-muted">
                <CoinIcon />
                <span className="text-xs font-medium">USDC Balance</span>
              </div>
              <span className="text-sm font-bold text-foreground">${usdcFormatted}</span>
            </div>
            {/* Role badges */}
            <div className="flex gap-1.5 flex-wrap">
              {showAdmin && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                  {isOwner ? "👑 Owner" : "⚡ Admin"}
                </span>
              )}
            </div>
            {/* Mint button */}
            <button onClick={handleMintUSDC} disabled={isMinting}
              className="w-full py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors">
              {isMinting ? "Minting..." : mintMessage || "🪙 Get 10,000 Test USDC"}
            </button>
          </div>
        )}

        {/* Not connected message */}
        {mounted && !isConnected && (
          <div className="mx-4 mt-4 p-3 rounded-xl bg-muted/10 border border-border text-center">
            <p className="text-xs text-muted">Connect your wallet to see balance and role</p>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider px-2 mb-2">Navigation</p>
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-white shadow-sm"
                    : "text-foreground hover:bg-muted/40"
                )}>
                <span className={active ? "text-white" : "text-muted"}>{item.icon}</span>
                {item.label}
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/70" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Drawer footer */}
        <div className="px-4 py-4 border-t border-border">
          <p className="text-xs text-muted text-center">
            Polkadot Hub EVM · Chain ID 420420417
          </p>
        </div>
      </div>
    </>
  );
}
