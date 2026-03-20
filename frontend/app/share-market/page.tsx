"use client";

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { NavbarClient } from "@/components/navbar-client";
import { PROPVERA_CONTRACT_ADDRESS, PROPVERA_ABI, MOCK_USDC_ADDRESS, MOCK_USDC_ABI } from "@/lib/contracts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { formatAddress } from "@/lib/utils";
import Link from "next/link";

export default function ShareMarketPage() {
  const { address, isConnected } = useAccount();
  const [txStatus, setTxStatus] = useState("");
  const [filter, setFilter] = useState("");

  const { data: listings, refetch } = useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS, abi: PROPVERA_ABI, functionName: "getAllActiveShareListings",
    query: { refetchInterval: 15_000 },
  });
  const { data: usdcAllowance, refetch: refetchAllowance } = useReadContract({
    address: MOCK_USDC_ADDRESS, abi: MOCK_USDC_ABI, functionName: "allowance",
    args: address ? [address, PROPVERA_CONTRACT_ADDRESS] : undefined, query: { enabled: !!address },
  });

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isSuccess) { setTxStatus("✓ Transaction confirmed!"); refetch(); refetchAllowance(); setTimeout(() => setTxStatus(""), 4000); }
  }, [isSuccess, refetch, refetchAllowance]);

  const allowance = (usdcAllowance as bigint) || 0n;
  const allListings = (listings as any[]) || [];
  const filtered = filter ? allListings.filter((l: any) => l.tokenId.toString() === filter) : allListings;

  const buyListing = (l: any) => {
    const totalCostWei = BigInt(l.numShares.toString()) * BigInt(l.pricePerShare.toString()) * 1_000_000n;
    if (allowance < totalCostWei) {
      writeContract({ address: MOCK_USDC_ADDRESS, abi: MOCK_USDC_ABI, functionName: "approve", args: [PROPVERA_CONTRACT_ADDRESS, totalCostWei] });
      setTxStatus("Approving USDC...");
    } else {
      writeContract({ address: PROPVERA_CONTRACT_ADDRESS, abi: PROPVERA_ABI, functionName: "buyListedShares", args: [l.listingId] });
      setTxStatus("Buying shares...");
    }
  };

  return (
    <><NavbarClient />
    <main className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div><h1 className="text-3xl font-bold">Share Marketplace</h1><p className="text-muted mt-1">Buy fractional shares from other investors</p></div>
          {txStatus && <div className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-lg text-sm font-medium">{txStatus}</div>}
        </div>

        <div className="flex gap-3 mb-6">
          <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter by Asset ID..." className="px-3 py-2 border border-border rounded-md text-sm bg-background w-48" />
          {filter && <button onClick={() => setFilter("")} className="text-sm text-muted hover:text-foreground">Clear</button>}
          <span className="text-sm text-muted self-center">{filtered.length} active listing{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted text-lg">No active share listings.</p>
            <p className="text-sm text-muted mt-2">Fractional holders can list shares from their portfolio dashboard.</p>
            <Link href="/dashboard" className="mt-4 inline-block"><Button>Go to Portfolio</Button></Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((l: any, i: number) => {
              const totalCost = Number(l.numShares) * Number(l.pricePerShare);
              const isMine = l.seller?.toLowerCase() === address?.toLowerCase();
              const totalCostWei = BigInt(l.numShares.toString()) * BigInt(l.pricePerShare.toString()) * 1_000_000n;
              const needsApproval = allowance < totalCostWei;
              return (
                <Card key={i}>
                  <CardContent className="pt-5">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Link href={`/asset/${l.tokenId}`} className="font-bold text-primary hover:underline">Asset #{l.tokenId.toString()}</Link>
                            <Badge variant="success">Active</Badge>
                          </div>
                          <p className="text-sm">{l.numShares.toString()} PVF @ {l.pricePerShare.toString()} USDC/share</p>
                          <p className="text-sm text-muted">Seller: {formatAddress(l.seller)} · Total: <span className="font-semibold text-foreground">{totalCost} USDC</span></p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {isMine ? (
                          <Badge variant="secondary">Your listing</Badge>
                        ) : isConnected ? (
                          <Button onClick={() => buyListing(l)} disabled={isPending}>
                            {isPending ? "Processing..." : needsApproval ? "Approve USDC" : `Buy for ${totalCost} USDC`}
                          </Button>
                        ) : (
                          <p className="text-sm text-muted">Connect wallet to buy</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </main></>
  );
}
