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
    return { name: `Asset`, image: "", description: "" };
  } catch {
    return { name: "Property", image: "", description: "" };
  }
}

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [addAdminAddr, setAddAdminAddr] = useState("");
  const [removeAdminAddr, setRemoveAdminAddr] = useState("");
  const [withdrawAddr, setWithdrawAddr] = useState("");
  const [withdrawAmt, setWithdrawAmt] = useState("");
  const [fracTokens, setFracTokens] = useState<Record<number, string>>({});
  const [dividendAmt, setDividendAmt] = useState<Record<number, string>>({});
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
    if (isSuccess) { setTxStatus("✓ Transaction confirmed!"); refetchAssets(); setTimeout(() => setTxStatus(""), 4000); }
  }, [isSuccess, refetchAssets]);

  const isOwner = mounted && address && owner
    ? address.toLowerCase() === (owner as string).toLowerCase() : false;
  const hasAccess = mounted && isConnected && (isAdmin || isOwner);

  if (!mounted) return null;
  if (!isConnected) return (
    <><NavbarClient /><main className="min-h-screen flex items-center justify-center"><p className="text-muted text-lg">Connect your wallet to continue.</p></main></>
  );
  if (!hasAccess) return (
    <><NavbarClient /><main className="min-h-screen flex items-center justify-center"><div className="text-center"><h2 className="text-2xl font-bold text-red-500 mb-2">Access Denied</h2><p className="text-muted">You are not an admin or owner of this contract.</p></div></main></>
  );

  const assets = (allAssets as any[]) || [];
  const pending = assets.filter((a: any) => !a.verified && a.seller !== "0x0000000000000000000000000000000000000000");
  const verified = assets.filter((a: any) => a.verified && !a.sold && !a.isFractionalized);
  const fractionalized = assets.filter((a: any) => a.isFractionalized);
  const usdcInContract = contractUSDCBalance ? (Number(contractUSDCBalance) / 1_000_000).toFixed(2) : "0.00";

  const doTx = (fn: string, args: any[]) => {
    writeContract({ address: PROPVERA_CONTRACT_ADDRESS, abi: PROPVERA_ABI, functionName: fn as any, args });
    setTxStatus("Transaction submitted...");
  };

  return (
    <><NavbarClient />
    <main className="min-h-screen bg-muted/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted mt-1">
              {isOwner ? "👑 Contract Owner" : "⚡ Admin"} — {formatAddress(address!)}
            </p>
          </div>
          {txStatus && <div className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-lg text-sm font-medium">{txStatus}</div>}
        </div>

        {/* PENDING VERIFICATION */}
        <Card>
          <CardHeader><CardTitle>Pending Verification ({pending.length})</CardTitle>
            <CardDescription>Assets waiting for admin verification before they can be purchased</CardDescription></CardHeader>
          <CardContent>
            {pending.length === 0 ? <p className="text-muted text-sm">No assets pending verification.</p> : (
              <div className="space-y-3">
                {pending.map((a: any) => {
                  const meta = parseTokenURI(a.tokenURI || "");
                  return (
                    <div key={a.tokenId.toString()} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div>
                        <p className="font-semibold">{meta.name || `Asset #${a.tokenId}`}</p>
                        <p className="text-sm text-muted">Token ID: {a.tokenId.toString()} · Seller: {formatAddress(a.seller)} · Price: {a.priceInEth.toString()} USDC</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => doTx("verifyAsset", [a.tokenId])} disabled={isPending}>Verify</Button>
                        <Button size="sm" variant="destructive" onClick={() => doTx("delistAssetAdmin", [a.tokenId])} disabled={isPending}>Delist</Button>
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
          <CardHeader><CardTitle>Fractionalize Assets ({verified.length})</CardTitle>
            <CardDescription>Split verified assets into ERC-20 tokens for fractional ownership</CardDescription></CardHeader>
          <CardContent>
            {verified.length === 0 ? <p className="text-muted text-sm">No verified, non-fractionalized assets.</p> : (
              <div className="space-y-3">
                {verified.map((a: any) => {
                  const meta = parseTokenURI(a.tokenURI || "");
                  const totalTokens = fracTokens[Number(a.tokenId)] || "100";
                  const ppt = totalTokens && Number(totalTokens) > 0
                    ? (Number(a.priceInEth) / Number(totalTokens)).toFixed(4) : "0";
                  return (
                    <div key={a.tokenId.toString()} className="p-4 border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold">{meta.name || `Asset #${a.tokenId}`}</p>
                          <p className="text-sm text-muted">Price: {a.priceInEth.toString()} USDC · Token ID: {a.tokenId.toString()}</p>
                        </div>
                        <Badge variant="success">Verified</Badge>
                      </div>
                      <div className="flex gap-3 items-end">
                        <div className="flex-1">
                          <label className="text-xs text-muted block mb-1">Total PVF tokens to issue</label>
                          <input type="number" value={totalTokens} onChange={e => setFracTokens(p => ({ ...p, [Number(a.tokenId)]: e.target.value }))}
                            className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background" placeholder="100" />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-muted block mb-1">Price per token (USDC)</label>
                          <input readOnly value={ppt} className="w-full px-3 py-2 border border-border rounded-md text-sm bg-muted/20" />
                        </div>
                        <Button size="sm" onClick={() => doTx("createFractionalAsset", [a.tokenId, BigInt(totalTokens || "100")])} disabled={isPending}>Fractionalize</Button>
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
          <CardHeader><CardTitle>Distribute Dividends ({fractionalized.length} assets)</CardTitle>
            <CardDescription>Push USDC dividends proportionally to all fractional holders</CardDescription></CardHeader>
          <CardContent>
            <p className="text-sm text-muted mb-4">Contract USDC balance: <span className="font-semibold text-foreground">${usdcInContract}</span></p>
            {fractionalized.length === 0 ? <p className="text-muted text-sm">No fractionalized assets.</p> : (
              <div className="space-y-3">
                {fractionalized.map((a: any) => {
                  const meta = parseTokenURI(a.tokenURI || "");
                  return (
                    <div key={a.tokenId.toString()} className="flex items-center gap-3 p-4 border border-border rounded-lg">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{meta.name || `Asset #${a.tokenId}`}</p>
                        <p className="text-xs text-muted">Accumulated: {a.accumulatedFractionalPaymentsInEth?.toString()} USDC</p>
                      </div>
                      <input type="number" value={dividendAmt[Number(a.tokenId)] || ""} onChange={e => setDividendAmt(p => ({ ...p, [Number(a.tokenId)]: e.target.value }))}
                        className="w-28 px-3 py-2 border border-border rounded-md text-sm bg-background" placeholder="USDC amt" />
                      <Button size="sm" onClick={() => doTx("distributeFractionalDividends", [a.tokenId, BigInt(dividendAmt[Number(a.tokenId)] || "0")])} disabled={isPending || !dividendAmt[Number(a.tokenId)]}>Distribute</Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* WITHDRAWAL CONTROL */}
        <Card>
          <CardHeader><CardTitle>Withdrawal Control</CardTitle>
            <CardDescription>Enable/disable fractional cancellations per asset</CardDescription></CardHeader>
          <CardContent>
            {fractionalized.length === 0 ? <p className="text-muted text-sm">No fractionalized assets.</p> : (
              <div className="space-y-3">
                {fractionalized.map((a: any) => {
                  const meta = parseTokenURI(a.tokenURI || "");
                  return (
                    <div key={a.tokenId.toString()} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div>
                        <p className="font-semibold text-sm">{meta.name || `Asset #${a.tokenId}`}</p>
                        <p className="text-xs text-muted">Token ID: {a.tokenId.toString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => doTx("setBuyerCanWithdraw", [a.tokenId, true])} disabled={isPending}>Enable Refunds</Button>
                        <Button size="sm" variant="outline" onClick={() => doTx("setBuyerCanWithdraw", [a.tokenId, false])} disabled={isPending}>Disable</Button>
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
              <CardHeader><CardTitle>Admin Management</CardTitle><CardDescription>Owner only — add or remove admins</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <input value={addAdminAddr} onChange={e => setAddAdminAddr(e.target.value)} placeholder="0x... address to add as admin"
                    className="flex-1 px-3 py-2 border border-border rounded-md text-sm bg-background" />
                  <Button onClick={() => { doTx("addAdmin", [addAdminAddr as `0x${string}`]); setAddAdminAddr(""); }} disabled={isPending || !addAdminAddr}>Add Admin</Button>
                </div>
                <div className="flex gap-3">
                  <input value={removeAdminAddr} onChange={e => setRemoveAdminAddr(e.target.value)} placeholder="0x... address to remove"
                    className="flex-1 px-3 py-2 border border-border rounded-md text-sm bg-background" />
                  <Button variant="destructive" onClick={() => { doTx("removeAdmin", [removeAdminAddr as `0x${string}`]); setRemoveAdminAddr(""); }} disabled={isPending || !removeAdminAddr}>Remove Admin</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Treasury</CardTitle><CardDescription>Withdraw USDC from the contract (owner only). Balance: ${usdcInContract}</CardDescription></CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <input value={withdrawAddr} onChange={e => setWithdrawAddr(e.target.value)} placeholder="Recipient 0x..."
                    className="flex-1 px-3 py-2 border border-border rounded-md text-sm bg-background" />
                  <input type="number" value={withdrawAmt} onChange={e => setWithdrawAmt(e.target.value)} placeholder="Amount (USDC)"
                    className="w-36 px-3 py-2 border border-border rounded-md text-sm bg-background" />
                  <Button onClick={() => doTx("withdrawUSDC", [withdrawAddr as `0x${string}`, BigInt(withdrawAmt || "0")])} disabled={isPending || !withdrawAddr || !withdrawAmt}>Withdraw</Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </main></>
  );
}
