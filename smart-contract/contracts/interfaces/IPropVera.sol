// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "../types/PropVeraTypes.sol";

/// @title IPropVera
/// @notice External interface for the PropVera real-estate NFT marketplace.
interface IPropVera {
    // ── Seller / Admin ───────────────────────────────────────────────────────
    function registerSeller() external;
    function addAdmin(address _admin) external;
    function removeAdmin(address _admin) external;

    // ── Asset lifecycle ──────────────────────────────────────────────────────
    function createAsset(string calldata _tokenURI, uint256 _priceInEth) external;
    function verifyAsset(uint256 tokenId) external;
    function delistAsset(uint256 tokenId) external;
    function delistAssetAdmin(uint256 tokenId) external;

    // ── Whole-asset purchase flow ────────────────────────────────────────────
    function buyAsset(uint256 tokenId) external;
    function confirmAssetPayment(uint256 tokenId) external;
    function cancelAssetPurchase(uint256 tokenId) external;

    // ── Fractionalization ────────────────────────────────────────────────────
    function createFractionalAsset(uint256 tokenId, uint256 totalTokensInEth) external;
    function buyFractionalAsset(uint256 tokenId, uint256 numTokensInEth) external;
    function cancelFractionalAssetPurchase(uint256 tokenId, uint256 numTokensInEth) external;
    function distributeFractionalDividends(uint256 tokenId, uint256 amountInEth) external;
    function setBuyerCanWithdraw(uint256 tokenId, bool canWithdraw) external;

    // ── Secondary share market ───────────────────────────────────────────────
    function transferShares(uint256 tokenId, address to, uint256 numSharesInEth) external;
    function listSharesForSale(uint256 tokenId, uint256 numSharesInEth, uint256 pricePerShareInEth) external;
    function buyListedShares(uint256 listingId) external;
    function cancelShareListing(uint256 listingId) external;

    // ── Treasury ─────────────────────────────────────────────────────────────
    function withdrawUSDC(address recipient, uint256 amountInEth) external;

    // ── Views ────────────────────────────────────────────────────────────────
    function isAssetPaidFor(uint256 tokenId) external view returns (bool);
    function getAssetBuyer(uint256 tokenId) external view returns (address);
    function isAssetCanceled(uint256 tokenId) external view returns (bool);
    function getBuyerFractions(address buyer, uint256 tokenId) external view returns (uint256);
    function getFractionalAssetBuyersList(uint256 tokenId) external view returns (address[] memory);
    function getFractionalPayments(uint256 tokenId) external view returns (uint256);
    function getSellerMetrics(address sellerAddress) external view returns (uint256 confirmed, uint256 canceled);
    function getAssetShareListings(uint256 tokenId) external view returns (PropVeraTypes.ShareListing[] memory);
    function getAllActiveShareListings() external view returns (PropVeraTypes.ShareListing[] memory);
    function getAssetDisplayInfo(uint256 tokenId) external view returns (PropVeraTypes.AssetDisplayInfo memory);
    function fetchAllAssetsWithDisplayInfo() external view returns (PropVeraTypes.AssetDisplayInfo[] memory);
    function fetchAvailableAssets() external view returns (PropVeraTypes.AssetDisplayInfo[] memory);
    function fetchFractionalizedAssets() external view returns (PropVeraTypes.AssetDisplayInfo[] memory);
    function getBuyerPortfolio(address buyer) external view returns (PropVeraTypes.BuyerPortfolio[] memory);
    function getSellerAssets(address seller) external view returns (PropVeraTypes.AssetDisplayInfo[] memory);
    function fetchFractionalAssetBuyers(uint256 tokenId) external view returns (PropVeraTypes.FractionalBuyer[] memory);
    function fetchAsset(uint256 tokenId) external view returns (PropVeraTypes.RealEstateAsset memory);
    function fetchAllListedAssets() external view returns (PropVeraTypes.RealEstateAsset[] memory);
    function fetchUnsoldAssets() external view returns (PropVeraTypes.RealEstateAsset[] memory);
}
