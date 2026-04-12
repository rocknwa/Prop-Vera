"use client";

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { NavbarClient } from "@/components/navbar-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PROPVERA_CONTRACT_ADDRESS, PROPVERA_ABI, MOCK_USDC_ADDRESS, MOCK_USDC_ABI } from "@/lib/contracts";
import { useEffect, useState } from "react";
import { formatAddress } from "@/lib/utils";

function parseTokenURI(uri: string): { name: string; image: string; description: string } {
  try {
    if (uri.startsWith("data:application/json;base64,")) {
      const json = JSON.parse(atob(uri.split(",")[1]));
      return { name: json.name || "Property", image: json.image || "", description: json.description || "" };
    }
  } catch {}
  return { name: "Property", image: "", description: "" };
}

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [addAdminAddr, setAddAdminAddr] = useState("");
  const [removeAdminAddr, setRemoveAdminAddr] = useState("");
  const [withdrawAddr, setWithdrawAddr] = useState("");
  const [withdrawAmt, setWithdrawAmt] = useState("");
  const [fracTokens, setFracTokens] = useState<Record<string, string>>({});
  const [dividendAmt, setDividendAmt] = useState<Record<string, string>>({});
  const [txStatus, setTxStatus] = useState("");

  useEffect(() => { setMounted(true); }, []);

  const { data: isAdmin } = useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS, abi: PROPVERA_ABI, functionName: "isAdmin",
    args: address ? [address] : undefined, query: { enabled: !!address },
  });
  const { data: owner } = useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS, abi: PROPVERA_ABI, functionName: "owner",
    query: { enabled: !!address },
  });
  const { data: allAssets, refetch: refetchAssets } = useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS, abi: PROPVERA_ABI, functionName: "fetchAllAssetsWithDisplayInfo",
    query: { enabled: !!address },
  });
  const { data: contractUSDCBalance } = useReadContract({
    address: MOCK_USDC_ADDRESS, abi: MOCK_USDC_ABI, functionName: "balanceOf",
    args: [PROPVERA_CONTRACT_ADDRESS], query: { enabled: !!address, refetchInterval: 10_000 },
  });

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isSuccess) {
      setTxStatus("✓ Transaction confirmed!");
      refetchAssets();
      setTimeout(() => setTxStatus(""), 4000);
    }
  }, [isSuccess, refetchAssets]);

  const isOwner = mounted && address && owner
    ? address.toLowerCase() === (owner as string).toLowerCase() : false;
  const hasAccess = mounted && isConnected && (isAdmin || isOwner);

  if (!mounted) return null;
  if (!isConnected) return (
    <><NavbarClient /><main className="min-h-screen flex items-center justify-center"><p className="text-muted text-lg">Connect your wallet to continue.</p></main></>
  );
  if (!hasAccess) return (
    <><NavbarClient /><main className="min-h-screen flex items-center justify-center">
      <div className="text-center"><h2 className="text-2xl font-bold text-red-500 mb-2">Access Denied</h2>
      <p className="text-muted">You are not an admin or owner of this contract.</p></div>
    </main></>
  );

  const assets = (allAssets as any[]) || [];
  const pending = assets.filter((a: any) => !a.verified && a.seller !== "0x0000000000000000000000000000000000000000");
  const verified = assets.filter((a: any) => a.verified && !a.sold && !a.isFractionalized);
  const fractionalized = assets.filter((a: any) => a.isFractionalized);
  const usdcInContract = contractUSDCBalance ? (Number(contractUSDCBalance) / 1_000_000).toFixed(2) : "0.00";

  return (
    <><NavbarClient />
    <main className="min-h-screen bg-muted/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted mt-1">{isOwner ? "👑 Contract Owner" : "⚡ Admin"} — {formatAddress(address!)}</p>
          </div>
          {txStatus && <div className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-lg text-sm font-medium">{txStatus}</div>}
        </div>

        {/* PENDING VERIFICATION */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Verification ({pending.length})</CardTitle>
            <CardDescription>Assets waiting for admin approval before buyers can purchase</CardDescription>
          </CardHeader>
          <CardContent>
            {pending.length === 0 ? <p className="text-muted text-sm">No assets pending verification.</p> : (
              <div className="space-y-3">
                {pending.map((a: any) => {
                  const meta = parseTokenURI(a.tokenURI || "");
                  const tokenId = BigInt(a.tokenId.toString()) as bigint;
                  return (
                    <div key={a.tokenId.toString()} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div>
                        <p className="font-semibold">{meta.name || `Asset #${a.tokenId}`}</p>
                        <p className="text-sm text-muted">
                          Token ID: {a.tokenId.toString()} · Seller: {formatAddress(a.seller)} · Price: {a.priceInEth.toString()} USDC
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" disabled={isPending}
                          onClick={() => { writeContract({ address: PROPVERA_CONTRACT_ADDRESS, abi: PROPVERA_ABI, functionName: "verifyAsset", args: [tokenId] }); setTxStatus("Verifying..."); }}>
                          Verify
                        </Button>
                        <Button size="sm" variant="destructive" disabled={isPending}
                          onClick={() => { writeContract({ address: PROPVERA_CONTRACT_ADDRESS, abi: PROPVERA_ABI, functionName: "delistAssetAdmin", args: [tokenId] }); setTxStatus("Delisting..."); }}>
                          Delist
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* FRACTIONALIZE */}
        <Card>
          <CardHeader>
            <CardTitle>Fractionalize Assets ({verified.length})</CardTitle>
            <CardDescription>Split verified assets into ERC-20 tokens for fractional ownership</CardDescription>
          </CardHeader>
          <CardContent>
            {verified.length === 0 ? <p className="text-muted text-sm">No verified, non-fractionalized assets.</p> : (
              <div className="space-y-3">
                {verified.map((a: any) => {
                  const meta = parseTokenURI(a.tokenURI || "");
                  const tid = a.tokenId.toString();
                  const totalTokens = fracTokens[tid] || "";
                  const ppt = Number(totalTokens) > 0 ? (Number(a.priceInEth) / Number(totalTokens)).toFixed(4) : "—";
                  const tokenId = BigInt(tid) as bigint;
                  return (
                    <div key={tid} className="p-4 border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold">{meta.name || `Asset #${tid}`}</p>
                          <p className="text-sm text-muted">Price: {a.priceInEth.toString()} USDC · Token ID: {tid}</p>
                        </div>
                        <Badge variant="success">Verified</Badge>
                      </div>
                      <div className="flex gap-3 items-end">
                        <div className="flex-1">
                          <label className="text-xs text-muted block mb-1">Total PVF tokens to issue</label>
                          <div className="flex items-center border border-border rounded-md overflow-hidden bg-background">
                            <button
                              type="button"
                              className="px-3 py-2 text-sm font-bold hover:bg-muted/20 select-none"
                              onClick={() => setFracTokens(p => ({ ...p, [tid]: String(Math.max(1, Number(p[tid] || "0") - 1)) }))}
                            >−</button>
                            <input
                              type="number"
                              min="1"
                              value={fracTokens[tid] ?? ""}
                              onChange={e => setFracTokens(p => ({ ...p, [tid]: e.target.value }))}
                              className="flex-1 px-2 py-2 text-sm text-center bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              placeholder="e.g. 100"
                            />
                            <button
                              type="button"
                              className="px-3 py-2 text-sm font-bold hover:bg-muted/20 select-none"
                              onClick={() => setFracTokens(p => ({ ...p, [tid]: String(Number(p[tid] || "0") + 1) }))}
                            >+</button>
                          </div>
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-muted block mb-1">Price per token (USDC)</label>
                          <input readOnly value={ppt} className="w-full px-3 py-2 border border-border rounded-md text-sm bg-muted/20" />
                        </div>
                        <Button size="sm" disabled={isPending || !fracTokens[tid] || Number(fracTokens[tid]) < 1}
                          onClick={() => { writeContract({ address: PROPVERA_CONTRACT_ADDRESS, abi: PROPVERA_ABI, functionName: "createFractionalAsset", args: [tokenId, BigInt(fracTokens[tid] || "0")] }); setTxStatus("Fractionalizing..."); }}>
                          Fractionalize
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* DIVIDENDS */}
        <Card>
          <CardHeader>
            <CardTitle>Distribute Dividends ({fractionalized.length} assets)</CardTitle>
            <CardDescription>Push USDC dividends proportionally to all fractional holders</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted mb-4">Contract USDC balance: <span className="font-semibold text-foreground">${usdcInContract}</span></p>
            {fractionalized.length === 0 ? <p className="text-muted text-sm">No fractionalized assets.</p> : (
              <div className="space-y-3">
                {fractionalized.map((a: any) => {
                  const meta = parseTokenURI(a.tokenURI || "");
                  const tid = a.tokenId.toString();
                  const tokenId = BigInt(tid) as bigint;
                  return (
                    <div key={tid} className="flex items-center gap-3 p-4 border border-border rounded-lg flex-wrap">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{meta.name || `Asset #${tid}`}</p>
                        <p className="text-xs text-muted">Accumulated: {a.accumulatedFractionalPaymentsInEth?.toString()} USDC</p>
                      </div>
                      <input type="number" value={dividendAmt[tid] || ""}
                        onChange={e => setDividendAmt(p => ({ ...p, [tid]: e.target.value }))}
                        className="w-28 px-3 py-2 border border-border rounded-md text-sm bg-background" placeholder="USDC amt" />
                      <Button size="sm" disabled={isPending || !dividendAmt[tid]}
                        onClick={() => { writeContract({ address: PROPVERA_CONTRACT_ADDRESS, abi: PROPVERA_ABI, functionName: "distributeFractionalDividends", args: [tokenId, BigInt(dividendAmt[tid] || "0")] }); setTxStatus("Distributing..."); }}>
                        Distribute
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* WITHDRAWAL CONTROL */}
        <Card>
          <CardHeader>
            <CardTitle>Withdrawal Control</CardTitle>
            <CardDescription>Enable or disable fractional cancellations per asset</CardDescription>
          </CardHeader>
          <CardContent>
            {fractionalized.length === 0 ? <p className="text-muted text-sm">No fractionalized assets.</p> : (
              <div className="space-y-3">
                {fractionalized.map((a: any) => {
                  const meta = parseTokenURI(a.tokenURI || "");
                  const tid = a.tokenId.toString();
                  const tokenId = BigInt(tid) as bigint;
                  return (
                    <div key={tid} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div>
                        <p className="font-semibold text-sm">{meta.name || `Asset #${tid}`}</p>
                        <p className="text-xs text-muted">Token ID: {tid}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" disabled={isPending}
                          onClick={() => { writeContract({ address: PROPVERA_CONTRACT_ADDRESS, abi: PROPVERA_ABI, functionName: "setBuyerCanWithdraw", args: [tokenId, true] }); setTxStatus("Enabling refunds..."); }}>
                          Enable Refunds
                        </Button>
                        <Button size="sm" variant="outline" disabled={isPending}
                          onClick={() => { writeContract({ address: PROPVERA_CONTRACT_ADDRESS, abi: PROPVERA_ABI, functionName: "setBuyerCanWithdraw", args: [tokenId, false] }); setTxStatus("Disabling..."); }}>
                          Disable
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* OWNER-ONLY */}
        {isOwner && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Admin Management</CardTitle>
                <CardDescription>Owner only — add or remove admin addresses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <input value={addAdminAddr} onChange={e => setAddAdminAddr(e.target.value)}
                    placeholder="0x... address to add as admin"
                    className="flex-1 px-3 py-2 border border-border rounded-md text-sm bg-background" />
                  <Button disabled={isPending || !addAdminAddr}
                    onClick={() => { writeContract({ address: PROPVERA_CONTRACT_ADDRESS, abi: PROPVERA_ABI, functionName: "addAdmin", args: [addAdminAddr as `0x${string}`] }); setAddAdminAddr(""); setTxStatus("Adding admin..."); }}>
                    Add Admin
                  </Button>
                </div>
                <div className="flex gap-3">
                  <input value={removeAdminAddr} onChange={e => setRemoveAdminAddr(e.target.value)}
                    placeholder="0x... address to remove"
                    className="flex-1 px-3 py-2 border border-border rounded-md text-sm bg-background" />
                  <Button variant="destructive" disabled={isPending || !removeAdminAddr}
                    onClick={() => { writeContract({ address: PROPVERA_CONTRACT_ADDRESS, abi: PROPVERA_ABI, functionName: "removeAdmin", args: [removeAdminAddr as `0x${string}`] }); setRemoveAdminAddr(""); setTxStatus("Removing admin..."); }}>
                    Remove Admin
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Treasury</CardTitle>
                <CardDescription>Withdraw USDC from the contract. Balance: ${usdcInContract}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 flex-wrap">
                  <input value={withdrawAddr} onChange={e => setWithdrawAddr(e.target.value)}
                    placeholder="Recipient 0x..."
                    className="flex-1 px-3 py-2 border border-border rounded-md text-sm bg-background min-w-48" />
                  <input type="number" value={withdrawAmt} onChange={e => setWithdrawAmt(e.target.value)}
                    placeholder="Amount (USDC)"
                    className="w-36 px-3 py-2 border border-border rounded-md text-sm bg-background" />
                  <Button disabled={isPending || !withdrawAddr || !withdrawAmt}
                    onClick={() => { writeContract({ address: PROPVERA_CONTRACT_ADDRESS, abi: PROPVERA_ABI, functionName: "withdrawUSDC", args: [withdrawAddr as `0x${string}`, BigInt(withdrawAmt || "0")] }); setTxStatus("Withdrawing..."); }}>
                    Withdraw
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </main></>
  );
}
