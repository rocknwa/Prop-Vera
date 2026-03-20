"use client";

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { NavbarClient } from "@/components/navbar-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PROPVERA_CONTRACT_ADDRESS, PROPVERA_ABI, MOCK_USDC_ADDRESS, MOCK_USDC_ABI } from "@/lib/contracts";
import { use, useEffect, useState } from "react";
import { formatAddress } from "@/lib/utils";

function parseTokenURI(uri: string) {
  try {
    if (uri?.startsWith("data:application/json;base64,")) return JSON.parse(atob(uri.split(",")[1]));
  } catch {}
  return { name: null, image: null, description: null, attributes: [] };
}

export default function AssetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const tokenId = BigInt(id);
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [fracAmt, setFracAmt] = useState("");
  const [txStatus, setTxStatus] = useState("");
  const [approveStep, setApproveStep] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const { data: asset, refetch } = useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS, abi: PROPVERA_ABI, functionName: "getAssetDisplayInfo", args: [tokenId],
  });
  const { data: buyers } = useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS, abi: PROPVERA_ABI, functionName: "fetchFractionalAssetBuyers", args: [tokenId],
    query: { enabled: !!(asset as any)?.isFractionalized },
  });
  const { data: shareListings } = useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS, abi: PROPVERA_ABI, functionName: "getAssetShareListings", args: [tokenId],
    query: { enabled: !!(asset as any)?.isFractionalized },
  });
  const { data: usdcAllowance, refetch: refetchAllowance } = useReadContract({
    address: MOCK_USDC_ADDRESS, abi: MOCK_USDC_ABI, functionName: "allowance",
    args: address ? [address, PROPVERA_CONTRACT_ADDRESS] : undefined, query: { enabled: !!address },
  });
  const { data: usdcBalance } = useReadContract({
    address: MOCK_USDC_ADDRESS, abi: MOCK_USDC_ABI, functionName: "balanceOf",
    args: address ? [address] : undefined, query: { enabled: !!address },
  });

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isSuccess) {
      refetch(); refetchAllowance();
      if (approveStep) { setApproveStep(false); setTxStatus("✓ Approved! Now submit your transaction."); }
      else setTxStatus("✓ Transaction confirmed!");
      setTimeout(() => setTxStatus(""), 5000);
    }
  }, [isSuccess, approveStep, refetch, refetchAllowance]);

  if (!mounted || !asset) return (
    <><NavbarClient /><main className="min-h-screen flex items-center justify-center"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></main></>
  );

  const a = asset as any;
  const meta = parseTokenURI(a.tokenURI);
  const name = meta.name || `Property #${id}`;
  const priceWei = BigInt(a.priceInEth.toString()) * 1_000_000n;
  const allowance = (usdcAllowance as bigint) || 0n;
  const balance = (usdcBalance as bigint) || 0n;
  const pct = a.isFractionalized && a.totalFractionalTokens > 0
    ? Math.round(((Number(a.totalFractionalTokens) - Number(a.remainingFractionalTokens)) / Number(a.totalFractionalTokens)) * 100) : 0;
  const fracCost = fracAmt ? BigInt(fracAmt) * BigInt(a.pricePerFractionalTokenInEth.toString()) : 0n;
  const fracCostWei = fracCost * 1_000_000n;
  const isBuyer = address && a.currentBuyer?.toLowerCase() === address.toLowerCase();

  const approveUSDC = (amount: bigint) => {
    setApproveStep(true);
    writeContract({ address: MOCK_USDC_ADDRESS, abi: MOCK_USDC_ABI, functionName: "approve", args: [PROPVERA_CONTRACT_ADDRESS, amount] });
    setTxStatus("Approving USDC...");
  };
  const buyWhole = () => {
    if (allowance < priceWei) { approveUSDC(priceWei); return; }
    writeContract({ address: PROPVERA_CONTRACT_ADDRESS, abi: PROPVERA_ABI, functionName: "buyAsset", args: [tokenId] });
    setTxStatus("Buying asset...");
  };
  const confirmPayment = () => {
    writeContract({ address: PROPVERA_CONTRACT_ADDRESS, abi: PROPVERA_ABI, functionName: "confirmAssetPayment", args: [tokenId] });
    setTxStatus("Confirming payment...");
  };
  const cancelPurchase = () => {
    writeContract({ address: PROPVERA_CONTRACT_ADDRESS, abi: PROPVERA_ABI, functionName: "cancelAssetPurchase", args: [tokenId] });
    setTxStatus("Canceling...");
  };
  const buyFractional = () => {
    if (!fracAmt) return;
    if (allowance < fracCostWei) { approveUSDC(fracCostWei); return; }
    writeContract({ address: PROPVERA_CONTRACT_ADDRESS, abi: PROPVERA_ABI, functionName: "buyFractionalAsset", args: [tokenId, BigInt(fracAmt)] });
    setTxStatus("Buying shares...");
  };
  const buyListed = (listingId: bigint, cost: bigint) => {
    const costWei = cost * 1_000_000n;
    if (allowance < costWei) { approveUSDC(costWei); return; }
    writeContract({ address: PROPVERA_CONTRACT_ADDRESS, abi: PROPVERA_ABI, functionName: "buyListedShares", args: [listingId] });
    setTxStatus("Buying listed shares...");
  };

  return (
    <><NavbarClient />
    <main className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {txStatus && <div className="mb-4 px-4 py-3 bg-emerald-100 text-emerald-800 rounded-lg text-sm font-medium">{txStatus}</div>}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* LEFT */}
          <div>
            <div className="rounded-xl overflow-hidden h-72 bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
              {meta.image && <img src={meta.image} alt={name} className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display="none")} />}
            </div>
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{name}</h1>
                {a.verified && <Badge variant="success">Verified</Badge>}
                {a.sold && <Badge variant="secondary">Sold</Badge>}
                {a.isFractionalized && <Badge>Fractionalized</Badge>}
              </div>
              {meta.description && <p className="text-muted text-sm">{meta.description}</p>}
              {meta.attributes?.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {meta.attributes.filter((attr: any) => attr.value).map((attr: any, i: number) => (
                    <div key={i} className="p-3 bg-muted/20 rounded-lg">
                      <p className="text-xs text-muted">{attr.trait_type}</p>
                      <p className="font-medium text-sm">{attr.value}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="pt-2 space-y-1 text-sm">
                <p><span className="text-muted">Token ID:</span> <span className="font-medium">#{id}</span></p>
                <p><span className="text-muted">Seller:</span> <span className="font-medium">{formatAddress(a.seller)}</span></p>
                <p><span className="text-muted">Price:</span> <span className="font-bold text-lg">{a.priceInEth.toString()} USDC</span></p>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-4">
            {/* Your balance */}
            {isConnected && (
              <Card><CardContent className="pt-4 pb-4">
                <p className="text-sm text-muted">Your USDC Balance: <span className="font-semibold text-foreground">${(Number(balance) / 1_000_000).toFixed(2)}</span></p>
              </CardContent></Card>
            )}

            {/* PENDING PURCHASE BANNER */}
            {isBuyer && a.isPaidFor && !a.sold && (
              <Card className="border-amber-400 bg-amber-50">
                <CardContent className="pt-4">
                  <p className="font-semibold text-amber-800 mb-3">⏳ You have a pending purchase</p>
                  <p className="text-sm text-amber-700 mb-4">Confirm payment to receive the NFT, or cancel for a 99% refund.</p>
                  <div className="flex gap-3">
                    <Button onClick={confirmPayment} disabled={isPending} className="flex-1">Confirm Payment</Button>
                    <Button onClick={cancelPurchase} disabled={isPending} variant="destructive" className="flex-1">Cancel (99% refund)</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* WHOLE ASSET PURCHASE */}
            {!a.isFractionalized && !a.sold && a.verified && !a.isPaidFor && (
              <Card>
                <CardHeader><CardTitle>Purchase Property</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted">Buy this property outright. After paying, confirm to receive the NFT (seller gets 97%, 3% platform fee).</p>
                  <p className="font-bold text-2xl">{a.priceInEth.toString()} USDC</p>
                  {!isConnected ? <p className="text-sm text-muted">Connect wallet to purchase</p> : (
                    <Button onClick={buyWhole} disabled={isPending} className="w-full">
                      {isPending ? "Processing..." : allowance < priceWei ? "Step 1: Approve USDC" : "Step 2: Buy Property"}
                    </Button>
                  )}
                  {allowance < priceWei && isConnected && <p className="text-xs text-muted text-center">You need to approve USDC spending first, then confirm the purchase.</p>}
                </CardContent>
              </Card>
            )}

            {/* FRACTIONAL PURCHASE */}
            {a.isFractionalized && Number(a.remainingFractionalTokens) > 0 && (
              <Card>
                <CardHeader><CardTitle>Buy Fractional Shares</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 bg-muted/20 rounded-lg"><p className="text-muted text-xs">Price per Token</p><p className="font-semibold">{a.pricePerFractionalTokenInEth.toString()} USDC</p></div>
                    <div className="p-3 bg-muted/20 rounded-lg"><p className="text-muted text-xs">Tokens Available</p><p className="font-semibold">{a.remainingFractionalTokens.toString()} PVF</p></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-muted mb-1"><span>Sold</span><span>{pct}%</span></div>
                    <div className="w-full bg-muted/30 rounded-full h-2"><div className="bg-primary h-full rounded-full" style={{ width: `${pct}%` }} /></div>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Number of tokens to buy</label>
                    <input type="number" value={fracAmt} onChange={e => setFracAmt(e.target.value)} max={a.remainingFractionalTokens.toString()}
                      placeholder={`Max: ${a.remainingFractionalTokens}`}
                      className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background" />
                    {fracAmt && <p className="text-sm mt-1">Total: <span className="font-semibold">{fracCost.toString()} USDC</span></p>}
                  </div>
                  {isConnected ? (
                    <Button onClick={buyFractional} disabled={isPending || !fracAmt} className="w-full">
                      {isPending ? "Processing..." : allowance < fracCostWei ? "Step 1: Approve USDC" : "Step 2: Buy Shares"}
                    </Button>
                  ) : <p className="text-sm text-muted">Connect wallet to invest</p>}
                </CardContent>
              </Card>
            )}

            {/* FRACTIONAL HOLDERS */}
            {a.isFractionalized && (buyers as any[])?.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Current Holders</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(buyers as any[]).map((b: any, i: number) => (
                      <div key={i} className="flex justify-between text-sm p-2 rounded bg-muted/10">
                        <span className="font-mono text-muted">{formatAddress(b.buyer)}</span>
                        <span className="font-medium">{b.numTokens.toString()} PVF</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* SECONDARY MARKET LISTINGS */}
            {(shareListings as any[])?.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Secondary Market</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(shareListings as any[]).map((l: any, i: number) => {
                      const totalCost = BigInt(l.numShares.toString()) * BigInt(l.pricePerShare.toString());
                      return (
                        <div key={i} className="flex items-center justify-between p-3 border border-border rounded-lg text-sm">
                          <div>
                            <p>{l.numShares.toString()} PVF @ {l.pricePerShare.toString()} USDC/share</p>
                            <p className="text-muted text-xs">Total: {totalCost.toString()} USDC · Seller: {formatAddress(l.seller)}</p>
                          </div>
                          {isConnected && l.seller?.toLowerCase() !== address?.toLowerCase() && (
                            <Button size="sm" onClick={() => buyListed(l.listingId, totalCost)} disabled={isPending}>
                              {allowance < totalCost * 1_000_000n ? "Approve" : "Buy"}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main></>
  );
}
