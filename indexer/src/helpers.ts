import { BigInt, Address, Bytes, ethereum } from "@graphprotocol/graph-ts";
import {
  Asset,
  FractionalAsset,
  FractionalPosition,
  ShareListing,
  Seller,
  DividendDistribution,
  FaucetDrip,
  ProtocolStats,
} from "../generated/schema";

// Helper to get or create ProtocolStats singleton
export function getProtocolStats(): ProtocolStats {
  let stats = ProtocolStats.load("stats");
  if (!stats) {
    stats = new ProtocolStats("stats");
    stats.totalAssets = BigInt.fromI32(0);
    stats.totalVerifiedAssets = BigInt.fromI32(0);
    stats.totalSoldAssets = BigInt.fromI32(0);
    stats.totalFractionalizedAssets = BigInt.fromI32(0);
    stats.totalSellers = BigInt.fromI32(0);
    stats.totalVolumeUSDC = BigInt.fromI32(0);
    stats.updatedAt = BigInt.fromI32(0);
    stats.save();
  }
  return stats;
}

// Helper to get or create Seller entity
export function getOrCreateSeller(address: Address, timestamp: BigInt): Seller {
  let seller = Seller.load(address.toHex());
  if (!seller) {
    seller = new Seller(address.toHex());
    seller.address = address;
    seller.registeredAt = timestamp;
    seller.confirmedSales = BigInt.fromI32(0);
    seller.canceledSales = BigInt.fromI32(0);
    seller.save();

    // Update protocol stats
    const stats = getProtocolStats();
    stats.totalSellers = stats.totalSellers.plus(BigInt.fromI32(1));
    stats.updatedAt = timestamp;
    stats.save();
  }
  return seller;
}

// Helper to get or create Asset entity
export function getOrCreateAsset(tokenId: BigInt, timestamp: BigInt): Asset {
  let asset = Asset.load(tokenId.toString());
  if (!asset) {
    asset = new Asset(tokenId.toString());
    asset.tokenId = tokenId;
    asset.seller = null;
    asset.priceInEth = BigInt.fromI32(0);
    asset.verified = false;
    asset.sold = false;
    asset.isFractionalized = false;
    asset.isPaidFor = false;
    asset.currentBuyer = null;
    asset.tokenURI = "";
    asset.createdAt = timestamp;
    asset.updatedAt = timestamp;
    asset.save();
  }
  return asset;
}

// Helper to get or create FractionalPosition
export function getOrCreateFractionalPosition(
  asset: Asset,
  holder: Address,
  timestamp: BigInt
): FractionalPosition {
  const id = asset.id + "-" + holder.toHex();
  let position = FractionalPosition.load(id);
  if (!position) {
    position = new FractionalPosition(id);
    position.asset = asset.id;
    position.fractionalAsset = asset.id; // Same as asset ID
    position.holder = holder;
    position.tokensOwned = BigInt.fromI32(0);
    position.investedAmount = BigInt.fromI32(0);
    position.updatedAt = timestamp;
    position.save();
  }
  return position;
}

// Helper to update asset timestamp
export function updateAssetTimestamp(asset: Asset, timestamp: BigInt): void {
  asset.updatedAt = timestamp;
  asset.save();
}

// Helper to generate unique ID for dividend distribution
export function generateDividendId(event: ethereum.Event): string {
  return event.transaction.hash.toHex() + "-" + event.logIndex.toString();
}

// Helper to generate unique ID for faucet drip
export function generateFaucetDripId(event: any): string {
  return event.transaction.hash.toHex() + "-" + event.logIndex.toString();
}