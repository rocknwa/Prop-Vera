// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/// @title PropVeraEvents
/// @notice All events for the PropVera protocol
///         Prices are emitted in ETH-unit (human-readable) values.
library PropVeraEvents {
    event AssetCreated(uint256 indexed tokenId, uint256 priceInEth, address indexed seller, bool verified);
    event AssetVerified(uint256 indexed tokenId, address indexed seller);
    event AssetDelisted(uint256 indexed tokenId, address indexed seller);
    event AssetPurchased(uint256 indexed tokenId, address indexed buyer, uint256 priceInEth);
    event AssetPaymentConfirmed(uint256 indexed tokenId, address indexed buyer);
    event AssetCanceled(uint256 indexed tokenId, address indexed buyer);

    event FractionalAssetCreated(
        uint256 indexed tokenId,
        uint256 totalTokensInEth,
        uint256 pricePerTokenInEth,
        address indexed seller
    );
    event FractionalAssetPurchased(
        uint256 indexed tokenId,
        address indexed buyer,
        uint256 numTokensInEth,
        uint256 totalPriceInEth
    );
    event FractionalDividendsDistributed(
        uint256 indexed tokenId,
        uint256 totalAmountInEth,
        address[] buyers,
        uint256[] amounts
    );

    event SellerRegistered(address indexed sellerAddress);
    event USDCWithdrawn(address indexed recipient, uint256 amountInEth);

    event SharesTransferred(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to,
        uint256 numSharesInEth
    );
    event SharesListed(
        uint256 indexed listingId,
        uint256 indexed tokenId,
        address indexed seller,
        uint256 numSharesInEth,
        uint256 pricePerShareInEth
    );
    event SharesPurchased(
        uint256 indexed listingId,
        uint256 indexed tokenId,
        address indexed buyer,
        address seller,
        uint256 numSharesInEth,
        uint256 totalPriceInEth
    );
    event ShareListingCanceled(uint256 indexed listingId, uint256 indexed tokenId, address indexed seller);
}
