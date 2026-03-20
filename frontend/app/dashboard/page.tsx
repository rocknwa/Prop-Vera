"use client";

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { NavbarClient } from "@/components/navbar-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PROPVERA_CONTRACT_ADDRESS, PROPVERA_ABI, MOCK_USDC_ADDRESS, MOCK_USDC_ABI, PROPVERA_FRACTIONAL_TOKEN_ADDRESS, PROPVERA_FRACTIONAL_TOKEN_ABI } from "@/lib/contracts";
import { useEffect, useState } from "react";
import { formatAddress } from "@/lib/utils";
import Link from "next/link";

function parseTokenURI(uri: string) {
  try {
    if (uri?.startsWith("data:application/json;base64,")) return JSON.parse(atob(uri.split(",")[1]));
  } catch {}
  return { name: null, image: null };
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [txStatus, setTxStatus] = useState("");
  const [transferTo, setTransferTo] = useState<Record<string, string>>({});
  const [transferAmt, setTransferAmt] = useState<Record<string, string>>({});
  const [listPrice, setListPrice] = useState<Record<string, string>>({});
  const [listAmt, setListAmt] = useState<Record<string, string>>({});

  useEffect(() => { setMounted(true); }, []);

  const { data: portfolio, refetch: refetchPortfolio } = useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS, abi: PROPVERA_ABI, functionName: "getBuyerPortfolio",
    args: address ? [address] : undefined, query: { enabled: !!address },
  });
  const { data: allAssets, refetch: refetchAssets } = useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS, abi: PROPVERA_ABI, functionName: "fetchAllAssetsWithDisplayInfo",
    query: { enabled: !!address },
  });
  const { data: allListings } = useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS, abi: PROPVERA_ABI, functionName: "getAllActiveShareListings",
    query: { enabled: !!address, refetchInterval: 10_000 },
  });
  const { data: usdcBalance, refetch: refetchUSDC } = useReadContract({
    address: MOCK_USDC_ADDRESS, abi: MOCK_USDC_ABI, functionName: "balanceOf",
    args: address ? [address] : undefined, query: { enabled: !!address, refetchInterval: 10_000 },
  });
  const { data: pvfBalance, refetch: refetchPVF } = useReadContract({
    address: PROPVERA_FRACTIONAL_TOKEN_ADDRESS, abi: PROPVERA_FRACTIONAL_TOKEN_ABI, functionName: "balanceOf",
    args: address ? [address] : undefined, query: { enabled: !!address, refetchInterval: 10_000 },
  });
  const { data: pvfAllowance, refetch: refetchAllowance } = useReadContract({
    address: PROPVERA_FRACTIONAL_TOKEN_ADDRESS, abi: PROPVERA_FRACTIONAL_TOKEN_ABI, functionName: "allowance",
    args: address ? [address, PROPVERA_CONTRACT_ADDRESS] : undefined, query: { enabled: !!address },
  });

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isSuccess) {
      setTxStatus("✓ Transaction confirmed!");
      refetchPortfolio(); refetchAssets(); refetchUSDC(); refetchPVF(); refetchAllowance();
      setTimeout(() => setTxStatus(""), 4000);
    }
  }, [isSuccess, refetchPortfolio, refetchAssets, refetchUSDC, refetchPVF, refetchAllowance]);

  if (!mounted) return null;
  if (!isConnected) return (
    <><NavbarClient /><main className="min-h-screen flex items-center justify-center"><div className="text-center"><p className="text-lg text-muted mb-4">Connect your wallet to view your dashboard.</p><Link href="/marketplace"><Button>Browse Marketplace</Button></Link></div></main></>
  );

  const assets = (allAssets as any[]) || [];
  const portfolioItems = (portfolio as any[]) || [];
  const myListings = ((allListings as any[]) || []).filter((l: any) => l.seller?.toLowerCase() === address?.toLowerCase());
  const pendingPurchases = assets.filter((a: any) => a.isPaidFor && a.currentBuyer?.toLowerCase() === address?.toLowerCase() && !a.sold);
  const usdcFmt = usdcBalance ? (Number(usdcBalance) / 1_000_000).toFixed(2) : "0.00";
  const pvfFmt = pvfBalance ? (Number(pvfBalance) / 1e18).toFixed(4) : "0.0000";
  const totalInvested = portfolioItems.reduce((s: number, p: any) => s + Number(p.investmentValueInEth), 0);
  const allowanceBig = (pvfAllowance as bigint) || 0n;

  const approvePVF = (numShares: bigint) => {
    const weiAmt = numShares * 10n ** 18n;
    writeContract({ address: PROPVERA_FRACTIONAL_TOKEN_ADDRESS, abi: PROPVERA_FRACTIONAL_TOKEN_ABI, functionName: "approve", args: [PROPVERA_CONTRACT_ADDRESS, weiAmt] });
    setTxStatus("Approving PVF...");
  };
  const doTransfer = (tokenId: bigint) => {
    const to = transferTo[tokenId.toString()];
    const amt = transferAmt[tokenId.toString()];
    if (!to || !amt) return;
    const needWei = BigInt(amt) * 10n ** 18n;
    if (allowanceBig < needWei) { approvePVF(BigInt(amt)); return; }
    writeContract({ address: PROPVERA_CONTRACT_ADDRESS, abi: PROPVERA_ABI, functionName: "transferShares", args: [tokenId, to as `0x${string}`, BigInt(amt)] });
    setTxStatus("Transferring...");
  };
  const doList = (tokenId: bigint) => {
    const amt = listAmt[tokenId.toString()];
    const price = listPrice[tokenId.toString()];
    if (!amt || !price) return;
    const needWei = BigInt(amt) * 10n ** 18n;
    if (allowanceBig < needWei) { approvePVF(BigInt(amt)); return; }
    writeContract({ address: PROPVERA_CONTRACT_ADDRESS, abi: PROPVERA_ABI, functionName: "listSharesForSale", args: [tokenId, BigInt(amt), BigInt(price)] });
    setTxStatus("Listing...");
  };
  const cancelListing = (listingId: bigint) => {
    writeContract({ address: PROPVERA_CONTRACT_ADDRESS, abi: PROPVERA_ABI, functionName: "cancelShareListing", args: [listingId] });
    setTxStatus("Canceling listing...");
  };
  const confirmPayment = (tokenId: bigint) => {
    writeContract({ address: PROPVERA_CONTRACT_ADDRESS, abi: PROPVERA_ABI, functionName: "confirmAssetPayment", args: [tokenId] });
    setTxStatus("Confirming payment...");
  };
  const cancelPurchase = (tokenId: bigint) => {
    writeContract({ address: PROPVERA_CONTRACT_ADDRESS, abi: PROPVERA_ABI, functionName: "cancelAssetPurchase", args: [tokenId] });
    setTxStatus("Canceling...");
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "portfolio", label: `Fractional (${portfolioItems.length})` },
    { id: "pending", label: `Pending (${pendingPurchases.length})` },
    { id: "listings", label: `My Listings (${myListings.length})` },
  ];

  return (
    <><NavbarClient />
    <main className="min-h-screen bg-muted/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-3xl font-bold">My Dashboard</h1><p className="text-muted mt-1 font-mono text-sm">{formatAddress(address!)}</p></div>
          {txStatus && <div className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-lg text-sm font-medium">{txStatus}</div>}
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-5 pb-5"><p className="text-xs text-muted">USDC Balance</p><p className="text-2xl font-bold">${usdcFmt}</p></CardContent></Card>
          <Card><CardContent className="pt-5 pb-5"><p className="text-xs text-muted">PVF Tokens</p><p className="text-2xl font-bold">{pvfFmt}</p></CardContent></Card>
          <Card><CardContent className="pt-5 pb-5"><p className="text-xs text-muted">Total Invested</p><p className="text-2xl font-bold">{totalInvested} USDC</p></CardContent></Card>
          <Card><CardContent className="pt-5 pb-5"><p className="text-xs text-muted">Positions</p><p className="text-2xl font-bold">{portfolioItems.length}</p></CardContent></Card>
        </div>

        {/* TABS */}
        <div className="flex gap-2 border-b border-border pb-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${activeTab === t.id ? "bg-primary text-white" : "text-muted hover:text-foreground"}`}>{t.label}</button>
          ))}
        </div>

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            {pendingPurchases.length > 0 && (
              <Card className="border-amber-400">
                <CardHeader><CardTitle className="text-amber-700">⏳ Action Required</CardTitle><CardDescription>You have pending asset purchases awaiting confirmation</CardDescription></CardHeader>
                <CardContent>
                  {pendingPurchases.map((a: any) => {
                    const meta = parseTokenURI(a.tokenURI);
                    return (
                      <div key={a.tokenId.toString()} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg mb-2">
                        <div><p className="font-semibold">{meta.name || `Asset #${a.tokenId}`}</p><p className="text-sm text-muted">{a.priceInEth.toString()} USDC</p></div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => confirmPayment(a.tokenId)} disabled={isPending}>Confirm</Button>
                          <Button size="sm" variant="destructive" onClick={() => cancelPurchase(a.tokenId)} disabled={isPending}>Cancel</Button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
            {portfolioItems.length === 0 && pendingPurchases.length === 0 ? (
              <Card><CardContent className="py-12 text-center">
                <p className="text-muted mb-4">No investments yet. Start by browsing available properties.</p>
                <Link href="/marketplace"><Button>Browse Marketplace</Button></Link>
              </CardContent></Card>
            ) : (
              <Card>
                <CardHeader><CardTitle>Portfolio Summary</CardTitle></CardHeader>
                <CardContent>
                  {portfolioItems.map((p: any) => {
                    const pctDisplay = (Number(p.ownershipPercentage) / 1e18).toFixed(2);
                    return (
                      <div key={p.tokenId.toString()} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                        <div><p className="font-medium">Asset #{p.tokenId.toString()}</p><p className="text-sm text-muted">{p.fractionalTokensOwned.toString()} PVF · {pctDisplay}% ownership</p></div>
                        <div className="text-right"><p className="font-semibold">{p.investmentValueInEth.toString()} USDC</p>
                          <Link href={`/asset/${p.tokenId}`}><Button size="sm" variant="outline" className="mt-1">View</Button></Link>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* FRACTIONAL PORTFOLIO */}
        {activeTab === "portfolio" && (
          <div className="space-y-4">
            {portfolioItems.length === 0 ? (
              <Card><CardContent className="py-12 text-center"><p className="text-muted">No fractional investments. Browse fractionalized assets to invest.</p>
                <Link href="/fractional" className="mt-4 inline-block"><Button>Browse Fractional</Button></Link></CardContent></Card>
            ) : portfolioItems.map((p: any) => {
              const pctDisplay = (Number(p.ownershipPercentage) / 1e18).toFixed(2);
              const tid = p.tokenId.toString();
              const needPVFWei = BigInt(transferAmt[tid] || "0") * 10n ** 18n;
              const needListWei = BigInt(listAmt[tid] || "0") * 10n ** 18n;
              return (
                <Card key={tid}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div><CardTitle>Asset #{tid}</CardTitle><CardDescription>{p.fractionalTokensOwned.toString()} PVF · {pctDisplay}% · {p.investmentValueInEth.toString()} USDC</CardDescription></div>
                      <Link href={`/asset/${tid}`}><Button size="sm" variant="outline">View Asset</Button></Link>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Transfer */}
                    <div>
                      <p className="text-sm font-medium mb-2">Transfer Shares</p>
                      <div className="flex gap-2">
                        <input value={transferTo[tid] || ""} onChange={e => setTransferTo(prev => ({ ...prev, [tid]: e.target.value }))} placeholder="Recipient 0x..." className="flex-1 px-3 py-2 border border-border rounded-md text-sm bg-background" />
                        <input type="number" value={transferAmt[tid] || ""} onChange={e => setTransferAmt(prev => ({ ...prev, [tid]: e.target.value }))} placeholder="Amount" className="w-24 px-3 py-2 border border-border rounded-md text-sm bg-background" />
                        <Button size="sm" onClick={() => doTransfer(p.tokenId)} disabled={isPending || !transferTo[tid] || !transferAmt[tid]}>
                          {allowanceBig < needPVFWei ? "Approve" : "Transfer"}
                        </Button>
                      </div>
                    </div>
                    {/* List for sale */}
                    <div>
                      <p className="text-sm font-medium mb-2">List Shares for Sale</p>
                      <div className="flex gap-2">
                        <input type="number" value={listAmt[tid] || ""} onChange={e => setListAmt(prev => ({ ...prev, [tid]: e.target.value }))} placeholder="Shares" className="w-28 px-3 py-2 border border-border rounded-md text-sm bg-background" />
                        <input type="number" value={listPrice[tid] || ""} onChange={e => setListPrice(prev => ({ ...prev, [tid]: e.target.value }))} placeholder="USDC/share" className="w-28 px-3 py-2 border border-border rounded-md text-sm bg-background" />
                        <Button size="sm" onClick={() => doList(p.tokenId)} disabled={isPending || !listAmt[tid] || !listPrice[tid]}>
                          {allowanceBig < needListWei ? "Approve" : "List"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* PENDING PURCHASES */}
        {activeTab === "pending" && (
          <div className="space-y-4">
            {pendingPurchases.length === 0 ? (
              <Card><CardContent className="py-12 text-center"><p className="text-muted">No pending purchases. Browse the marketplace to buy assets.</p></CardContent></Card>
            ) : pendingPurchases.map((a: any) => {
              const meta = parseTokenURI(a.tokenURI);
              return (
                <Card key={a.tokenId.toString()} className="border-amber-400">
                  <CardContent className="pt-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-lg">{meta.name || `Asset #${a.tokenId}`}</p>
                        <p className="text-muted">{a.priceInEth.toString()} USDC · Token #{a.tokenId.toString()}</p>
                        <p className="text-xs text-amber-600 mt-1">Awaiting your confirmation to complete the purchase</p>
                      </div>
                      <div className="flex gap-3">
                        <Button onClick={() => confirmPayment(a.tokenId)} disabled={isPending}>Confirm & Receive NFT</Button>
                        <Button variant="destructive" onClick={() => cancelPurchase(a.tokenId)} disabled={isPending}>Cancel (99% refund)</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* MY LISTINGS */}
        {activeTab === "listings" && (
          <div className="space-y-4">
            {myListings.length === 0 ? (
              <Card><CardContent className="py-12 text-center"><p className="text-muted">No active listings. Go to your portfolio to list fractional shares for sale.</p></CardContent></Card>
            ) : (
              <Card>
                <CardHeader><CardTitle>My Active Share Listings</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {myListings.map((l: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div>
                          <p className="font-semibold">Asset #{l.tokenId.toString()}</p>
                          <p className="text-sm text-muted">{l.numShares.toString()} PVF @ {l.pricePerShare.toString()} USDC/share</p>
                          <p className="text-sm font-medium">Total: {(Number(l.numShares) * Number(l.pricePerShare)).toString()} USDC</p>
                        </div>
                        <div className="flex gap-2 items-center">
                          <Badge variant="success">Active</Badge>
                          <Button size="sm" variant="destructive" onClick={() => cancelListing(l.listingId)} disabled={isPending}>Cancel</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </main></>
  );
}
