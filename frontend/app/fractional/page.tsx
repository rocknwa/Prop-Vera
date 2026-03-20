"use client";

import { useReadContract } from "wagmi";
import { NavbarClient } from "@/components/navbar-client";
import { PROPVERA_CONTRACT_ADDRESS, PROPVERA_ABI } from "@/lib/contracts";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function parseTokenURI(uri: string) {
  try {
    if (uri?.startsWith("data:application/json;base64,")) return JSON.parse(atob(uri.split(",")[1]));
  } catch {}
  return { name: null, image: null, description: null };
}

export default function FractionalPage() {
  const { data: assets, isLoading } = useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS,
    abi: PROPVERA_ABI,
    functionName: "fetchFractionalizedAssets",
  });

  const list = (assets as any[]) || [];

  return (
    <><NavbarClient />
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Fractional Properties</h1>
          <p className="text-muted mt-1">Invest in shares of premium real estate — starting from any amount</p>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="h-80 bg-muted/20 rounded-xl animate-pulse" />)}
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted text-lg">No fractionalized assets yet.</p>
            <p className="text-sm text-muted mt-2">Admins can fractionalize verified assets.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {list.map((a: any) => {
              const meta = parseTokenURI(a.tokenURI);
              const name = meta.name || `Property #${a.tokenId}`;
              const total = Number(a.totalFractionalTokens);
              const remaining = Number(a.remainingFractionalTokens);
              const sold = total > 0 ? Math.round(((total - remaining) / total) * 100) : 0;
              return (
                <div key={a.tokenId.toString()} className="rounded-xl border border-border bg-background overflow-hidden hover:shadow-md transition-shadow">
                  <div className="h-44 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 relative">
                    {meta.image && <img src={meta.image} alt={name} className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display="none")} />}
                    <div className="absolute top-2 right-2"><Badge>Fractional</Badge></div>
                  </div>
                  <div className="p-5 space-y-3">
                    <h3 className="font-bold text-lg line-clamp-1">{name}</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="p-2 bg-muted/20 rounded"><p className="text-muted text-xs">Per Token</p><p className="font-semibold">{a.pricePerFractionalTokenInEth.toString()} USDC</p></div>
                      <div className="p-2 bg-muted/20 rounded"><p className="text-muted text-xs">Available</p><p className="font-semibold">{remaining} PVF</p></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-muted mb-1"><span>Sold</span><span>{sold}%</span></div>
                      <div className="w-full bg-muted/30 rounded-full h-2">
                        <div className="bg-primary h-full rounded-full" style={{ width: `${sold}%` }} />
                      </div>
                    </div>
                    <p className="text-sm text-muted">Total value: {a.priceInEth.toString()} USDC</p>
                    <Link href={`/asset/${a.tokenId}`}>
                      <Button className="w-full" disabled={remaining === 0}>
                        {remaining === 0 ? "Fully Sold" : "Invest Now"}
                      </Button>
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
