import { BigInt, Address, Bytes, ethereum } from "@graphprotocol/graph-ts";
import {
  AssetCreated,
  AssetVerified,
  AssetDelisted,
  AssetPurchased,
  AssetPaymentConfirmed,
  AssetCanceled,
  FractionalAssetCreated,
  FractionalAssetPurchased,
  FractionalDividendsDistributed,
  SellerRegistered,
  USDCWithdrawn,
  SharesTransferred,
  SharesListed,
  SharesPurchased,
  ShareListingCanceled,
} from "../generated/PropVera/PropVera";
import {
  Asset,
  FractionalAsset,
  FractionalPosition,
  ShareListing,
  Seller,
  DividendDistribution,
  ProtocolStats,
} from "../generated/schema";
import {
  getProtocolStats,
  getOrCreateSeller,
  getOrCreateAsset,
  getOrCreateFractionalPosition,
  updateAssetTimestamp,
  generateDividendId,
} from "./helpers";

export function handleAssetCreated(event: AssetCreated): void {
  const asset = getOrCreateAsset(event.params.tokenId, event.block.timestamp);
  const seller = getOrCreateSeller(event.params.seller, event.block.timestamp);
  asset.seller = seller.id;
  asset.priceInEth = event.params.priceInEth;
  asset.verified = event.params.verified;
  asset.tokenURI = ""; // Will be set separately if available
  updateAssetTimestamp(asset, event.block.timestamp);

  // Update protocol stats
  const stats = getProtocolStats();
  stats.totalAssets = stats.totalAssets.plus(BigInt.fromI32(1));
  if (event.params.verified) {
    stats.totalVerifiedAssets = stats.totalVerifiedAssets.plus(BigInt.fromI32(1));
  }
  stats.updatedAt = event.block.timestamp;
  stats.save();
}

export function handleAssetVerified(event: AssetVerified): void {
  const asset = getOrCreateAsset(event.params.tokenId, event.block.timestamp);
  asset.verified = true;
  updateAssetTimestamp(asset, event.block.timestamp);

  // Update protocol stats
  const stats = getProtocolStats();
  stats.totalVerifiedAssets = stats.totalVerifiedAssets.plus(BigInt.fromI32(1));
  stats.updatedAt = event.block.timestamp;
  stats.save();
}

export function handleAssetDelisted(event: AssetDelisted): void {
  const asset = getOrCreateAsset(event.params.tokenId, event.block.timestamp);
  asset.seller = null;
  asset.verified = false;
  asset.sold = false;
  asset.isFractionalized = false;
  asset.isPaidFor = false;
  asset.currentBuyer = null;
  updateAssetTimestamp(asset, event.block.timestamp);

  // Update protocol stats
  const stats = getProtocolStats();
  stats.totalAssets = stats.totalAssets.minus(BigInt.fromI32(1));
  if (asset.verified) {
    stats.totalVerifiedAssets = stats.totalVerifiedAssets.minus(BigInt.fromI32(1));
  }
  if (asset.sold) {
    stats.totalSoldAssets = stats.totalSoldAssets.minus(BigInt.fromI32(1));
  }
  if (asset.isFractionalized) {
    stats.totalFractionalizedAssets = stats.totalFractionalizedAssets.minus(BigInt.fromI32(1));
  }
  stats.updatedAt = event.block.timestamp;
  stats.save();
}

export function handleAssetPurchased(event: AssetPurchased): void {
  const asset = getOrCreateAsset(event.params.tokenId, event.block.timestamp);
  asset.isPaidFor = true;
  asset.currentBuyer = event.params.buyer;
  updateAssetTimestamp(asset, event.block.timestamp);
}

export function handleAssetPaymentConfirmed(event: AssetPaymentConfirmed): void {
  const asset = getOrCreateAsset(event.params.tokenId, event.block.timestamp);
  asset.sold = true;
  asset.isPaidFor = false;
  updateAssetTimestamp(asset, event.block.timestamp);

  // Update seller stats if seller exists
  if (asset.seller) {
    const sellerEntity = Seller.load(asset.seller!);
    if (sellerEntity) {
      sellerEntity.confirmedSales = sellerEntity.confirmedSales.plus(BigInt.fromI32(1));
      sellerEntity.save();
    }
  }

  // Update protocol stats
  const stats = getProtocolStats();
  stats.totalSoldAssets = stats.totalSoldAssets.plus(BigInt.fromI32(1));
  stats.totalVolumeUSDC = stats.totalVolumeUSDC.plus(asset.priceInEth);
  stats.updatedAt = event.block.timestamp;
  stats.save();
}

export function handleAssetCanceled(event: AssetCanceled): void {
  const asset = getOrCreateAsset(event.params.tokenId, event.block.timestamp);
  asset.isPaidFor = false;
  asset.currentBuyer = null;
  updateAssetTimestamp(asset, event.block.timestamp);

  // Update seller stats if seller exists
  if (asset.seller) {
    const sellerEntity = Seller.load(asset.seller!);
    if (sellerEntity) {
      sellerEntity.canceledSales = sellerEntity.canceledSales.plus(BigInt.fromI32(1));
      sellerEntity.save();
    }
  }
}

export function handleFractionalAssetCreated(event: FractionalAssetCreated): void {
  const asset = getOrCreateAsset(event.params.tokenId, event.block.timestamp);
  asset.isFractionalized = true;
  updateAssetTimestamp(asset, event.block.timestamp);

  // Create FractionalAsset
  const fractionalAsset = new FractionalAsset(event.params.tokenId.toString());
  fractionalAsset.asset = asset.id;
  fractionalAsset.totalTokens = event.params.totalTokensInEth;
  fractionalAsset.pricePerToken = event.params.pricePerTokenInEth;
  fractionalAsset.remainingTokens = event.params.totalTokensInEth;
  fractionalAsset.accumulatedPayments = BigInt.fromI32(0);
  fractionalAsset.save();

  // Update protocol stats
  const stats = getProtocolStats();
  stats.totalFractionalizedAssets = stats.totalFractionalizedAssets.plus(BigInt.fromI32(1));
  stats.updatedAt = event.block.timestamp;
  stats.save();
}

export function handleFractionalAssetPurchased(event: FractionalAssetPurchased): void {
  const asset = getOrCreateAsset(event.params.tokenId, event.block.timestamp);
  const fractionalAsset = FractionalAsset.load(event.params.tokenId.toString());
  if (!fractionalAsset) return;

  // Update fractional asset
  fractionalAsset.remainingTokens = fractionalAsset.remainingTokens.minus(event.params.numTokensInEth);
  fractionalAsset.accumulatedPayments = fractionalAsset.accumulatedPayments.plus(event.params.totalPriceInEth);
  fractionalAsset.save();

  // Update or create position
  const position = getOrCreateFractionalPosition(
    asset,
    event.params.buyer,
    event.block.timestamp
  );
  position.tokensOwned = position.tokensOwned.plus(event.params.numTokensInEth);
  position.investedAmount = position.investedAmount.plus(event.params.totalPriceInEth);
  position.updatedAt = event.block.timestamp;
  position.save();

  updateAssetTimestamp(asset, event.block.timestamp);
}

export function handleSharesTransferred(event: SharesTransferred): void {
  const asset = getOrCreateAsset(event.params.tokenId, event.block.timestamp);

  // Update sender position
  const senderPosition = getOrCreateFractionalPosition(
    asset,
    event.params.from,
    event.block.timestamp
  );
  senderPosition.tokensOwned = senderPosition.tokensOwned.minus(event.params.numSharesInEth);
  senderPosition.updatedAt = event.block.timestamp;
  senderPosition.save();

  // Update receiver position
  const receiverPosition = getOrCreateFractionalPosition(
    asset,
    event.params.to,
    event.block.timestamp
  );
  receiverPosition.tokensOwned = receiverPosition.tokensOwned.plus(event.params.numSharesInEth);
  receiverPosition.updatedAt = event.block.timestamp;
  receiverPosition.save();

  updateAssetTimestamp(asset, event.block.timestamp);
}

export function handleSharesListed(event: SharesListed): void {
  const asset = getOrCreateAsset(event.params.tokenId, event.block.timestamp);
  const shareListing = new ShareListing(event.params.listingId.toString());
  shareListing.listingId = event.params.listingId;
  shareListing.asset = asset.id;
  shareListing.seller = event.params.seller;
  shareListing.numShares = event.params.numSharesInEth;
  shareListing.pricePerShare = event.params.pricePerShareInEth;
  shareListing.active = true;
  shareListing.createdAt = event.block.timestamp;
  shareListing.save();

  updateAssetTimestamp(asset, event.block.timestamp);
}

export function handleSharesPurchased(event: SharesPurchased): void {
  const shareListing = ShareListing.load(event.params.listingId.toString());
  if (!shareListing) return;

  shareListing.active = false;
  shareListing.save();

  const asset = getOrCreateAsset(event.params.tokenId, event.block.timestamp);

  // Update buyer position
  const buyerPosition = getOrCreateFractionalPosition(
    asset,
    event.params.buyer,
    event.block.timestamp
  );
  buyerPosition.tokensOwned = buyerPosition.tokensOwned.plus(event.params.numSharesInEth);
  buyerPosition.updatedAt = event.block.timestamp;
  buyerPosition.save();

  // Update seller position
  const sellerPosition = getOrCreateFractionalPosition(
    asset,
    event.params.seller,
    event.block.timestamp
  );
  sellerPosition.tokensOwned = sellerPosition.tokensOwned.minus(event.params.numSharesInEth);
  sellerPosition.updatedAt = event.block.timestamp;
  sellerPosition.save();

  // Update protocol stats
  const stats = getProtocolStats();
  stats.totalVolumeUSDC = stats.totalVolumeUSDC.plus(event.params.totalPriceInEth);
  stats.updatedAt = event.block.timestamp;
  stats.save();

  updateAssetTimestamp(asset, event.block.timestamp);
}

export function handleShareListingCanceled(event: ShareListingCanceled): void {
  const shareListing = ShareListing.load(event.params.listingId.toString());
  if (!shareListing) return;

  shareListing.active = false;
  shareListing.save();

  const asset = getOrCreateAsset(event.params.tokenId, event.block.timestamp);
  updateAssetTimestamp(asset, event.block.timestamp);
}

export function handleDividendsDistributed(event: FractionalDividendsDistributed): void {
  const asset = getOrCreateAsset(event.params.tokenId, event.block.timestamp);
  const dividend = new DividendDistribution(generateDividendId(event));
  dividend.asset = asset.id;
  dividend.totalAmount = event.params.totalAmountInEth;
  dividend.timestamp = event.block.timestamp;
  dividend.recipients = event.params.buyers.map<Bytes>((addr) => addr as Bytes);
  dividend.amounts = event.params.amounts;
  dividend.save();

  updateAssetTimestamp(asset, event.block.timestamp);
}

export function handleSellerRegistered(event: SellerRegistered): void {
  getOrCreateSeller(event.params.sellerAddress, event.block.timestamp);
}

export function handleUSDCWithdrawn(event: USDCWithdrawn): void {
  // This event might be used for tracking withdrawals, but no specific entity update needed
  // Could be used to track seller activity if needed
}