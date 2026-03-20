"use client";

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { NavbarClient } from "@/components/navbar-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PROPVERA_CONTRACT_ADDRESS, PROPVERA_ABI, MOCK_USDC_ADDRESS, MOCK_USDC_ABI } from "@/lib/contracts";
import { useEffect, useState } from "react";
import { formatAddress } from "@/lib/utils";
import Link from "next/link";

function parseTokenURI(uri: string) {
  try {
    if (uri.startsWith("data:application/json;base64,")) {
      const json = JSON.parse(atob(uri.split(",")[1]));
      return { name: json.name || "Property", image: json.image || "", description: json.description || "", location: "" };
    }
  } catch {}
  return { name: "Property", image: "", description: "", location: "" };
}

export default function SellerPage() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", imageUrl: "", location: "", propertyType: "Residential", size: "", price: "" });
  const [txStatus, setTxStatus] = useState("");
  const [step, setStep] = useState<"idle"|"approving"|"creating">("idle");

  useEffect(() => { setMounted(true); }, []);

  const { data: isSeller, refetch: refetchSeller } = useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS, abi: PROPVERA_ABI, functionName: "sellers",
    args: address ? [address] : undefined, query: { enabled: !!address },
  });

  const { data: myAssets, refetch: refetchAssets } = useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS, abi: PROPVERA_ABI, functionName: "getSellerAssets",
    args: address ? [address] : undefined, query: { enabled: !!address && !!isSeller },
  });

  const { data: metrics } = useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS, abi: PROPVERA_ABI, functionName: "getSellerMetrics",
    args: address ? [address] : undefined, query: { enabled: !!address && !!isSeller },
  });

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isSuccess) {
      if (step === "approving") setTxStatus("✓ Registered! Refreshing...");
      else setTxStatus("✓ Asset created!");
      setStep("idle");
      refetchSeller();
      refetchAssets();
      setForm({ name: "", description: "", imageUrl: "", location: "", propertyType: "Residential", size: "", price: "" });
      setTimeout(() => setTxStatus(""), 4000);
    }
  }, [isSuccess, step, refetchSeller, refetchAssets]);

  const handleRegister = () => {
    writeContract({ address: PROPVERA_CONTRACT_ADDRESS, abi: PROPVERA_ABI, functionName: "registerSeller" });
    setStep("approving");
    setTxStatus("Registering as seller...");
  };

  const handleCreateAsset = () => {
    if (!form.name || !form.price) return;
    const metadata = { name: form.name, description: form.description, image: form.imageUrl,
      attributes: [{ trait_type: "Location", value: form.location }, { trait_type: "Property Type", value: form.propertyType }, { trait_type: "Size (sqft)", value: form.size }] };
    const tokenURI = `data:application/json;base64,${btoa(JSON.stringify(metadata))}`;
    writeContract({ address: PROPVERA_CONTRACT_ADDRESS, abi: PROPVERA_ABI, functionName: "createAsset", args: [tokenURI, BigInt(form.price)] });
    setStep("creating");
    setTxStatus("Creating asset...");
  };

  const handleDelist = (tokenId: bigint) => {
    writeContract({ address: PROPVERA_CONTRACT_ADDRESS, abi: PROPVERA_ABI, functionName: "delistAsset", args: [tokenId] });
    setTxStatus("Delisting...");
  };

  if (!mounted) return null;

  if (!isConnected) return (
    <><NavbarClient /><main className="min-h-screen flex items-center justify-center"><div className="text-center"><p className="text-lg text-muted mb-4">Connect your wallet to access the seller dashboard.</p></div></main></>
  );

  const assets = (myAssets as any[]) || [];
  const [confirmed, canceled] = metrics ? [Number((metrics as any)[0]), Number((metrics as any)[1])] : [0, 0];

  return (
    <><NavbarClient />
    <main className="min-h-screen bg-muted/10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="flex items-center justify-between">
          <div><h1 className="text-3xl font-bold">Seller Dashboard</h1>
            <p className="text-muted mt-1">{formatAddress(address!)}</p></div>
          {txStatus && <div className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-lg text-sm font-medium">{txStatus}</div>}
        </div>

        {/* REGISTER */}
        {!isSeller ? (
          <Card>
            <CardHeader><CardTitle>Become a Seller</CardTitle>
              <CardDescription>Register once to list your real estate properties on PropVera</CardDescription></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="p-4 bg-muted/20 rounded-lg"><p className="font-semibold mb-1">📋 List Properties</p><p className="text-muted">Create NFT listings for your real estate assets</p></div>
                  <div className="p-4 bg-muted/20 rounded-lg"><p className="font-semibold mb-1">💰 Earn USDC</p><p className="text-muted">Receive 97% of sale price when buyers confirm payment</p></div>
                  <div className="p-4 bg-muted/20 rounded-lg"><p className="font-semibold mb-1">🔀 Fractionalize</p><p className="text-muted">Admins can split your asset into fractional tokens</p></div>
                </div>
                <Button onClick={handleRegister} disabled={isPending} size="lg">
                  {isPending ? "Registering..." : "Register as Seller"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* METRICS */}
            <div className="grid grid-cols-3 gap-4">
              <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold">{assets.length}</p><p className="text-muted text-sm">Total Listings</p></CardContent></Card>
              <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-green-600">{confirmed}</p><p className="text-muted text-sm">Confirmed Sales</p></CardContent></Card>
              <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-red-500">{canceled}</p><p className="text-muted text-sm">Canceled Purchases</p></CardContent></Card>
            </div>

            {/* CREATE ASSET */}
            <Card>
              <CardHeader><CardTitle>List New Property</CardTitle>
                <CardDescription>Create an NFT for your real estate asset. Admin must verify before buyers can purchase.</CardDescription></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="text-sm font-medium block mb-1">Property Name *</label>
                    <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Modern Lagos Apartment" className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background" /></div>
                  <div><label className="text-sm font-medium block mb-1">Price (USDC) *</label>
                    <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="e.g. 50000" className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background" /></div>
                  <div><label className="text-sm font-medium block mb-1">Location</label>
                    <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Lagos, Nigeria" className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background" /></div>
                  <div><label className="text-sm font-medium block mb-1">Property Type</label>
                    <select value={form.propertyType} onChange={e => setForm(p => ({ ...p, propertyType: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background">
                      {["Residential","Commercial","Land","Industrial"].map(t => <option key={t}>{t}</option>)}</select></div>
                  <div><label className="text-sm font-medium block mb-1">Size (sqft)</label>
                    <input type="number" value={form.size} onChange={e => setForm(p => ({ ...p, size: e.target.value }))} placeholder="e.g. 1200" className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background" /></div>
                  <div><label className="text-sm font-medium block mb-1">Image URL</label>
                    <input value={form.imageUrl} onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))} placeholder="https://... (any image link)" className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background" /></div>
                  <div className="md:col-span-2"><label className="text-sm font-medium block mb-1">Description</label>
                    <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Describe your property..." className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background resize-none" /></div>
                </div>
                {form.name && form.price && (
                  <div className="mt-4 p-3 bg-muted/20 rounded-lg text-sm">
                    <p className="font-medium mb-1">Preview</p>
                    <p className="text-muted">{form.name} · {form.propertyType} · {form.location} · {form.price} USDC</p>
                  </div>
                )}
                <Button className="mt-4" onClick={handleCreateAsset} disabled={isPending || !form.name || !form.price}>
                  {isPending ? "Creating..." : "Create Asset NFT"}
                </Button>
              </CardContent>
            </Card>

            {/* MY ASSETS */}
            <Card>
              <CardHeader><CardTitle>My Assets ({assets.length})</CardTitle></CardHeader>
              <CardContent>
                {assets.length === 0 ? <p className="text-muted text-sm">No assets listed yet. Create one above.</p> : (
                  <div className="space-y-3">
                    {assets.map((a: any) => {
                      const meta = parseTokenURI(a.tokenURI || "");
                      return (
                        <div key={a.tokenId.toString()} className="flex items-center justify-between p-4 border border-border rounded-lg">
                          <div className="flex items-center gap-3">
                            {meta.image && <img src={meta.image} alt="" className="w-12 h-12 rounded object-cover" onError={e => (e.currentTarget.style.display = "none")} />}
                            <div>
                              <p className="font-semibold">{meta.name}</p>
                              <p className="text-sm text-muted">#{a.tokenId.toString()} · {a.priceInEth.toString()} USDC</p>
                              {a.isPaidFor && <p className="text-xs text-amber-600">⏳ Payment pending from {formatAddress(a.currentBuyer)}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {a.sold ? <Badge variant="secondary">Sold</Badge>
                              : a.verified ? <Badge variant="success">Verified</Badge>
                              : <Badge variant="warning">Pending Review</Badge>}
                            {a.isFractionalized && <Badge>Fractionalized</Badge>}
                            {!a.sold && !a.isFractionalized && (
                              <Button size="sm" variant="destructive" onClick={() => handleDelist(a.tokenId)} disabled={isPending}>Delist</Button>
                            )}
                            <Link href={`/asset/${a.tokenId}`}><Button size="sm" variant="outline">View</Button></Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </main></>
  );
}
