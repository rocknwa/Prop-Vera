"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { AssetCard } from "@/components/asset-card";
import { Spinner } from "@/components/ui/spinner";
import { Asset } from "@/lib/types";

// Mock data - replace with actual API call
const mockAssets: Asset[] = [
  {
    id: "1",
    type: "residential",
    title: "Modern Downtown Apartment",
    description: "Contemporary 2-bedroom apartment in prime downtown location",
    location: "New York, NY",
    totalShares: 1000,
    availableShares: 450,
    pricePerShare: 500,
    totalValue: 500000,
    image: "/placeholder-1.jpg",
    seller: "0x1234...5678",
    createdAt: new Date("2024-01-15"),
    status: "active",
  },
  {
    id: "2",
    type: "commercial",
    title: "Tech Hub Office Building",
    description: "5-story commercial building with mixed tenants",
    location: "San Francisco, CA",
    totalShares: 2000,
    availableShares: 800,
    pricePerShare: 750,
    totalValue: 1500000,
    image: "/placeholder-2.jpg",
    seller: "0x9876...5432",
    createdAt: new Date("2024-01-10"),
    status: "active",
  },
  {
    id: "3",
    type: "residential",
    title: "Luxury Beach Resort",
    description: "Beachfront property with resort amenities",
    location: "Miami, FL",
    totalShares: 500,
    availableShares: 0,
    pricePerShare: 2000,
    totalValue: 1000000,
    image: "/placeholder-3.jpg",
    seller: "0xabcd...efgh",
    createdAt: new Date("2024-01-05"),
    status: "completed",
  },
];

export default function MarketplacePage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setAssets(mockAssets);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const filteredAssets = 
    filter === "all"
      ? assets
      : assets.filter((a) => a.type === filter);

  const handleInvest = (assetId: string) => {
    console.log("Investing in asset:", assetId);
    // TODO: Navigate to investment flow
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold">Real Estate Marketplace</h1>
              <p className="text-muted mt-1">
                Discover and invest in premium properties
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-8 pb-4 border-b border-border overflow-x-auto">
            {["all", "residential", "commercial"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  filter === f
                    ? "bg-primary text-white"
                    : "bg-muted/20 text-foreground hover:bg-muted/40"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Assets Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Spinner size="lg" />
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted text-lg">No assets found</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  onInvest={handleInvest}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
