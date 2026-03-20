"use client";

import { useReadContract, useAccount } from "wagmi";
import { NavbarClient } from "@/components/navbar-client";
import { PROPVERA_CONTRACT_ADDRESS, PROPVERA_ABI } from "@/lib/contracts";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

function parseTokenURI(uri: string) {
  try {
    if (uri?.startsWith("data:application/json;base64,")) {
      return JSON.parse(atob(uri.split(",")[1]));
    }
  } catch {}
  return { name: null, image: null, description: null };
}

export default function MarketplacePage() {
  const { address } = useAccount();
  const [filter, setFilter] = useState("all");

  const { data: assets, isLoading } = useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS,
    abi: PROPVERA_ABI,
    functionName: "fetchAvailableAssets",
  });

  const list = (assets as any[]) || [];

  const filtered = filter === "fractionalized"
    ? list.filter((a: any) => a.isFractionalized)
    : filter === "whole" ? list.filter((a: any) => !a.isFractionalized)
    : list;

  return (
    <><NavbarClient />
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Real Estate Marketplace</h1>
          <p className="text-muted mt-1">Verified properties available for purchase</p>
        </div>

        <div className="flex gap-2 mb-8 pb-4 border-b border-border">
          {[["all","All Assets"],["whole","Whole Purchase"],["fractionalized","Fractional"]].map(([f, label]) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${filter === f ? "bg-primary text-white" : "bg-muted/20 hover:bg-muted/40"}`}>{label}</button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="h-72 bg-muted/20 rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted text-lg">No assets available yet.</p>
            <p className="text-sm text-muted mt-2">Check back soon or become a seller to list your property.</p>
            <Link href="/seller" className="mt-4 inline-block"><Button>Become a Seller</Button></Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((a: any) => {
              const meta = parseTokenURI(a.tokenURI);
              const name = meta.name || `Property #${a.tokenId}`;
              const image = meta.image;
              const pct = a.isFractionalized && a.totalFractionalTokens > 0
                ? Math.round(((Number(a.totalFractionalTokens) - Number(a.remainingFractionalTokens)) / Number(a.totalFractionalTokens)) * 100) : 0;
              return (
                <div key={a.tokenId.toString()} className="rounded-xl border border-border bg-background overflow-hidden hover:shadow-md transition-shadow">
                  <div className="h-44 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 relative">
                    {image ? <img src={image} alt={name} className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display="none")} /> : null}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Badge variant="success">Verified</Badge>
                      {a.isFractionalized && <Badge>Fractional</Badge>}
                    </div>
                  </div>
                  <div className="p-5 space-y-3">
                    <h3 className="font-bold text-lg line-clamp-1">{name}</h3>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted">Price</span>
                      <span className="font-semibold">{a.priceInEth.toString()} USDC</span>
                    </div>
                    {a.isFractionalized ? (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted">Per Token</span>
                          <span className="font-medium">{a.pricePerFractionalTokenInEth.toString()} USDC</span>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-muted mb-1">
                            <span>Sold</span><span>{pct}%</span>
                          </div>
                          <div className="w-full bg-muted/30 rounded-full h-2">
                            <div className="bg-primary h-full rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted">Seller: {a.seller?.slice(0,6)}...{a.seller?.slice(-4)}</p>
                    )}
                    <Link href={`/asset/${a.tokenId}`}>
                      <Button className="w-full">{a.isFractionalized ? "Buy Fractional Shares" : "Purchase Property"}</Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main></>
  );
}
