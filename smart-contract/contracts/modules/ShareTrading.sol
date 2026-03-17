// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../storage/PropVeraStorage.sol";
import "../errors/PropVeraErrors.sol";
import "../events/PropVeraEvents.sol";
import "../libraries/ConversionLib.sol";
import "../types/PropVeraTypes.sol";
import "../tokens/PropVeraFractionalToken.sol";

/// @title ShareTrading
/// @notice Peer-to-peer secondary market for fractional ownership shares.
///         Includes direct off-platform transfers and on-platform escrow listings.
abstract contract ShareTrading is PropVeraStorage, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using SafeERC20 for PropVeraFractionalToken;

    uint256 internal constant SHARE_TRADING_FEE_PERCENTAGE = 2;
    uint256 internal constant _SHARE_DENOM = 100;

    // ── Abstract references ───────────────────────────────────────────────────
    function _usdc() internal view virtual returns (IERC20);

    function _owner() internal view virtual returns (address);

    function _realEstateToken()
        internal
        view
        virtual
        returns (PropVeraFractionalToken);

    // ── Direct share transfer (off-platform, no fee) ──────────────────────────

    /// @notice Transfer fractional shares directly to another address.
    /// @param tokenId        Asset NFT id.
    /// @param to             Recipient.
    /// @param numSharesInEth Shares to transfer (whole-token, converted to wei).
    function transferShares(
        uint256 tokenId,
        address to,
        uint256 numSharesInEth
    ) external nonReentrant {
        if (to == address(0) || to == msg.sender)
            revert PropVeraErrors.InvalidRecipient();
        if (numSharesInEth == 0) revert PropVeraErrors.InvalidAmount();
        if (fractionalAssets[tokenId].seller == address(0))
            revert PropVeraErrors.FractionalAssetDoesNotExist();

        uint256 numSharesInWei = ConversionLib.tokenToWei(numSharesInEth);
        uint256 senderBal = buyerFractions[msg.sender][tokenId]; // 1 SLOAD

        if (senderBal < numSharesInWei)
            revert PropVeraErrors.NotEnoughTokensOwned();

        // CEI: state before transfer
        buyerFractions[msg.sender][tokenId] = senderBal - numSharesInWei;

        bool isNewBuyer = buyerFractions[to][tokenId] == 0;
        buyerFractions[to][tokenId] += numSharesInWei;
        if (isNewBuyer) fractionalAssetBuyers[tokenId].push(to);

        _realEstateToken().safeTransferFrom(msg.sender, to, numSharesInWei);

        emit PropVeraEvents.SharesTransferred(
            tokenId,
            msg.sender,
            to,
            numSharesInEth
        );
    }

    // ── Escrow listings ───────────────────────────────────────────────────────

    /// @notice List fractional shares for sale via the platform escrow.
    function listSharesForSale(
        uint256 tokenId,
        uint256 numSharesInEth,
        uint256 pricePerShareInEth
    ) external nonReentrant {
        if (numSharesInEth == 0) revert PropVeraErrors.InvalidAmount();
        if (pricePerShareInEth == 0) revert PropVeraErrors.InvalidPrice();
        if (fractionalAssets[tokenId].seller == address(0))
            revert PropVeraErrors.FractionalAssetDoesNotExist();

        uint256 numSharesInWei = ConversionLib.tokenToWei(numSharesInEth);
        uint256 pricePerShareWei = ConversionLib.usdcToWei(pricePerShareInEth);

        if (buyerFractions[msg.sender][tokenId] < numSharesInWei)
            revert PropVeraErrors.NotEnoughTokensOwned();

        // Lock shares in escrow
        _realEstateToken().safeTransferFrom(
            msg.sender,
            address(this),
            numSharesInWei
        );

        unchecked {
            ++_shareListingIds;
        }
        uint256 newId = _shareListingIds;

        shareListings[newId] = PropVeraTypes.ShareListing({
            listingId: newId,
            tokenId: tokenId,
            seller: msg.sender,
            active: true,
            numShares: numSharesInWei,
            pricePerShare: pricePerShareWei
        });

        assetShareListings[tokenId].push(newId);

        emit PropVeraEvents.SharesListed(
            newId,
            tokenId,
            msg.sender,
            numSharesInEth,
            pricePerShareInEth
        );
    }

    /// @notice Buy shares from an active escrow listing.
    function buyListedShares(uint256 listingId) external nonReentrant {
        PropVeraTypes.ShareListing storage listing = shareListings[listingId];

        // Cache SLOADs
        uint256 storedId = listing.listingId;
        bool active = listing.active;
        address seller = listing.seller;
        uint256 numShares = listing.numShares;
        uint256 pps = listing.pricePerShare;
        uint256 tid = listing.tokenId;

        if (storedId == 0) revert PropVeraErrors.ShareListingNotFound();
        if (!active) revert PropVeraErrors.ShareListingNotActive();
        if (seller == msg.sender) revert PropVeraErrors.CannotBuyOwnShares();

        uint256 totalPriceWei = (numShares * pps) / ConversionLib.TOKEN_UNIT;
        uint256 tradingFee = (totalPriceWei * SHARE_TRADING_FEE_PERCENTAGE) /
            _SHARE_DENOM;
        uint256 sellerPay = totalPriceWei - tradingFee;

        // CEI: deactivate before any transfer
        listing.active = false;

        // Update fractional balances
        buyerFractions[seller][tid] -= numShares;
        bool isNewBuyer = buyerFractions[msg.sender][tid] == 0;
        buyerFractions[msg.sender][tid] += numShares;
        if (isNewBuyer) fractionalAssetBuyers[tid].push(msg.sender);

        // Transfers
        _usdc().safeTransferFrom(msg.sender, address(this), totalPriceWei);
        _usdc().safeTransfer(seller, sellerPay);
        _usdc().safeTransfer(_owner(), tradingFee);
        _realEstateToken().safeTransfer(msg.sender, numShares);

        emit PropVeraEvents.SharesPurchased(
            listingId,
            tid,
            msg.sender,
            seller,
            ConversionLib.tokenFromWei(numShares),
            ConversionLib.usdcFromWei(totalPriceWei)
        );
    }

    /// @notice Cancel an active share listing and reclaim escrowed shares.
    function cancelShareListing(uint256 listingId) external nonReentrant {
        PropVeraTypes.ShareListing storage listing = shareListings[listingId];

        if (listing.listingId == 0)
            revert PropVeraErrors.ShareListingNotFound();
        if (listing.seller != msg.sender)
            revert PropVeraErrors.NotShareSeller();
        if (!listing.active) revert PropVeraErrors.ShareListingNotActive();

        uint256 numShares = listing.numShares;
        address seller = listing.seller;
        uint256 tid = listing.tokenId;

        // CEI: deactivate first
        listing.active = false;

        _realEstateToken().safeTransfer(seller, numShares);

        emit PropVeraEvents.ShareListingCanceled(listingId, tid, msg.sender);
    }

    // ── View helpers ──────────────────────────────────────────────────────────

    /// @notice All active listings for a specific asset.
    function getAssetShareListings(
        uint256 tokenId
    ) external view returns (PropVeraTypes.ShareListing[] memory) {
        uint256[] storage ids = assetShareListings[tokenId];
        uint256 len = ids.length;

        uint256 activeCount;
        for (uint256 i; i < len; ) {
            if (shareListings[ids[i]].active) {
                unchecked {
                    ++activeCount;
                }
            }
            unchecked {
                ++i;
            }
        }

        PropVeraTypes.ShareListing[]
            memory result = new PropVeraTypes.ShareListing[](activeCount);
        uint256 idx;
        for (uint256 i; i < len; ) {
            uint256 lid = ids[i];
            if (shareListings[lid].active) {
                PropVeraTypes.ShareListing memory sl = shareListings[lid];
                sl.numShares = ConversionLib.tokenFromWei(sl.numShares);
                sl.pricePerShare = ConversionLib.usdcFromWei(sl.pricePerShare);
                result[idx] = sl;
                unchecked {
                    ++idx;
                }
            }
            unchecked {
                ++i;
            }
        }
        return result;
    }

    /// @notice All active listings across every asset.
    function getAllActiveShareListings()
        external
        view
        returns (PropVeraTypes.ShareListing[] memory)
    {
        uint256 total = _shareListingIds;

        uint256 activeCount;
        for (uint256 i = 1; i <= total; ) {
            if (shareListings[i].active) {
                unchecked {
                    ++activeCount;
                }
            }
            unchecked {
                ++i;
            }
        }

        PropVeraTypes.ShareListing[]
            memory result = new PropVeraTypes.ShareListing[](activeCount);
        uint256 idx;
        for (uint256 i = 1; i <= total; ) {
            if (shareListings[i].active) {
                PropVeraTypes.ShareListing memory sl = shareListings[i];
                sl.numShares = ConversionLib.tokenFromWei(sl.numShares);
                sl.pricePerShare = ConversionLib.usdcFromWei(sl.pricePerShare);
                result[idx] = sl;
                unchecked {
                    ++idx;
                }
            }
            unchecked {
                ++i;
            }
        }
        return result;
    }
}
