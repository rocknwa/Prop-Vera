// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

/// @title PropVeraTypes
/// @notice All shared structs for the PropVera protocol
library PropVeraTypes {
    // -----------------------------------------------------------------------
    // Core data structs
    // -----------------------------------------------------------------------

    /// @notice Represents a real estate NFT listed for sale.
    /// @dev price is stored in USDC wei (6 decimals). Pack booleans into same
    ///      slot as the address to save one storage slot vs a naive layout.
    struct RealEstateAsset {
        uint256 tokenId;     // slot 0
        uint256 price;       // slot 1  (USDC wei, 6 dec)
        address payable seller; // slot 2 (20 bytes)
        bool sold;           // slot 2 (packed)
        bool verified;       // slot 2 (packed)
    }

    /// @notice Tracks the fractional sale data for a tokenized asset.
    /// @dev totalTokens and pricePerToken both in their respective wei units.
    struct FractionalAsset {
        uint256 tokenId;        // slot 0
        uint256 totalTokens;    // slot 1  (token wei, 18 dec) – remaining unsold
        uint256 pricePerToken;  // slot 2  (USDC wei, 6 dec)
        address payable seller; // slot 3
    }

    /// @notice Secondary-market listing of fractional shares.
    /// @dev active flag packed with tokenId uint96 to save a slot when ABI
    ///      encoding is not the concern, but kept separate here for clarity
    ///      since listingId and tokenId need full 256 bits in the worst case.
    struct ShareListing {
        uint256 listingId;       // slot 0
        uint256 tokenId;         // slot 1
        address seller;          // slot 2 (20 bytes)
        bool active;             // slot 2 (packed)
        uint256 numShares;       // slot 3  (token wei)
        uint256 pricePerShare;   // slot 4  (USDC wei)
    }

    // -----------------------------------------------------------------------
    // Read-only / view structs (never written to storage)
    // -----------------------------------------------------------------------

    /// @notice Extended asset info returned by view functions for UI display.
    struct AssetDisplayInfo {
        uint256 tokenId;
        uint256 priceInEth;
        address seller;
        bool sold;
        bool verified;
        bool isPaidFor;
        bool isCanceled;
        address currentBuyer;
        string tokenURI;
        bool isFractionalized;
        uint256 totalFractionalTokens;
        uint256 remainingFractionalTokens;
        uint256 pricePerFractionalTokenInEth;
        uint256 accumulatedFractionalPaymentsInEth;
    }

    /// @notice Portfolio item returned per buyer.
    struct BuyerPortfolio {
        uint256 tokenId;
        uint256 fractionalTokensOwned;
        uint256 ownershipPercentage;
        uint256 investmentValueInEth;
    }

    /// @notice Fractional buyer data returned by view functions.
    struct FractionalBuyer {
        address buyer;
        uint256 numTokens;    // ETH-unit (divided by 1e18)
        uint256 percentage;
    }
}
