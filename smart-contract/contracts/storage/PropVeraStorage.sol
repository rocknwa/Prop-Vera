// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "../types/PropVeraTypes.sol";

/// @title PropVeraStorage
/// @notice Central storage layout for the PropVera protocol.
///         Inheriting this contract in PropVera.sol keeps the storage
///         layout stable if an upgradeability pattern is added later.
abstract contract PropVeraStorage {

    // ── Counters ─────────────────────────────────────────────────────────────
    uint256 internal _tokenIds;
    uint256 internal _shareListingIds;

    // ── Public mappings (direct UI / external contract access) ───────────────
    mapping(uint256 => PropVeraTypes.RealEstateAsset) public realEstateAssets;
    mapping(address => bool)                          public sellers;
    mapping(uint256 => PropVeraTypes.FractionalAsset) public fractionalAssets;
    mapping(address => bool)                          public isAdmin;
    mapping(uint256 => PropVeraTypes.ShareListing)    public shareListings;
    mapping(uint256 => bool)                          public buyerCanWithdraw;

    // ── Private mappings (exposed via getters) ────────────────────────────────
    mapping(address => uint256) internal sellerConfirmedPurchases;
    mapping(address => uint256) internal sellerCanceledPurchases;
    mapping(uint256 => bool)    internal assetPaidFor;
    mapping(uint256 => address payable) internal assetBuyers;
    mapping(uint256 => bool)    internal assetCanceled;

    /// @dev buyer → tokenId → token wei owned
    mapping(address => mapping(uint256 => uint256)) internal buyerFractions;

    /// @dev tokenId → list of unique buyer addresses (append-only)
    mapping(uint256 => address[]) internal fractionalAssetBuyers;

    /// @dev tokenId → total USDC wei collected from fractional sales
    mapping(uint256 => uint256) internal fractionalPayments;

    /// @dev tokenId → array of secondary-market listing IDs
    mapping(uint256 => uint256[]) internal assetShareListings;
}
