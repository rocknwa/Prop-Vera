// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/// @title PropVeraErrors
/// @notice All custom errors for the PropVera protocol
library PropVeraErrors {
    // --- Access Control ---
    error NotAdmin(address caller);
    error NotAuthorized();
    error SellerAlreadyRegistered();
    error SellerNotRegistered();
    error SellerNotOwner();
    error AdminAlreadyExists();
    error AdminDoesNotExist();

    // --- Asset State ---
    error AssetDoesNotExist();
    error AssetAlreadyVerified();
    error AssetAlreadySold();
    error AssetAlreadyPaid();
    error AssetNotPaid();
    error AssetNotVerified();
    error FractionalizedAssetWithBuyers();
    error FractionalAssetDoesNotExist();

    // --- Input Validation ---
    error InvalidPrice();
    error InvalidAmount();
    error InvalidRecipient();

    // --- Token / Balance ---
    error InsufficientTokens();
    error InsufficientUSDCBalance();
    error NoTokensOwned();
    error NoTokensIssued();
    error NotEnoughTokensOwned();

    // --- Purchase Flow ---
    error NotBuyer();
    error ContractNotApproved();
    error CannotWithdrawYet();

    // --- Share Trading ---
    error ShareListingNotFound();
    error ShareListingNotActive();
    error NotShareSeller();
    error CannotBuyOwnShares();
}
