"use client";

import Link from "next/link";
import { Asset } from "@/lib/types";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AssetCardProps {
  asset: Asset;
  onInvest?: (assetId: string) => void;
}

export function AssetCard({ asset, onInvest }: AssetCardProps) {
  const soldPercentage = Math.round(
    ((asset.totalShares - asset.availableShares) / asset.totalShares) * 100
  );

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="h-40 bg-gradient-to-br from-primary/20 to-secondary/20 relative">
        {asset.image && (
          <img
            src={asset.image}
            alt={asset.title}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute top-2 right-2">
          <Badge variant={asset.status === "active" ? "success" : "warning"}>
            {asset.status}
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2">{asset.title}</CardTitle>
            {asset.location && (
              <CardDescription className="mt-1">{asset.location}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pb-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted mb-1">Price per Share</p>
            <p className="font-semibold">{formatCurrency(asset.pricePerShare)}</p>
          </div>
          <div>
            <p className="text-xs text-muted mb-1">Available</p>
            <p className="font-semibold">{formatNumber(asset.availableShares)}</p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted">Shares Sold</p>
            <p className="text-xs font-medium">{soldPercentage}%</p>
          </div>
          <div className="w-full bg-muted/30 rounded-full h-2">
            <div
              className="bg-primary h-full rounded-full transition-all"
              style={{ width: `${soldPercentage}%` }}
            />
          </div>
        </div>

        <div>
          <p className="text-xs text-muted mb-1">Total Value</p>
          <p className="text-lg font-bold">{formatCurrency(asset.totalValue)}</p>
        </div>
      </CardContent>

      <CardFooter className="gap-2">
        <Link href={`/assets/${asset.id}`} className="flex-1">
          <Button variant="outline" className="w-full">
            View Details
          </Button>
        </Link>
        <Button
          onClick={() => onInvest?.(asset.id)}
          disabled={asset.availableShares === 0}
          className="flex-1"
        >
          {asset.availableShares === 0 ? "Sold Out" : "Invest"}
        </Button>
      </CardFooter>
    </Card>
  );
}
