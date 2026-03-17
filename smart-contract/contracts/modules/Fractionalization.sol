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

/// @title Fractionalization
/// @notice Handles fractional asset creation, buying, cancellation, and
///         dividend distribution.
///
/// @dev    Pull-over-push consideration:
///         `distributeFractionalDividends` still uses push (loop + transfer)
///         because the original design requires it and changing it would alter
///         business logic. The loop is bounded by the number of unique fractional
///         buyers per asset. For production at scale, an off-chain Merkle-drop
///         or per-user claimable balance pattern is recommended.
abstract contract Fractionalization is PropVeraStorage, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using SafeERC20 for PropVeraFractionalToken;

    // ── Constants ─────────────────────────────────────────────────────────────
    uint256 internal constant _PERCENTAGE_SCALE = 1e18;
    uint256 internal constant _PERCENT_DENOM    = 100;
    uint256 internal constant _START_ID         = 1;

    // ── Abstract references ───────────────────────────────────────────────────
    function _usdc()  internal view virtual returns (IERC20);
    function _owner() internal view virtual returns (address);
    function _ownerOf721(uint256 tokenId) internal view virtual returns (address);
    function _getApproved721(uint256 tokenId) internal view virtual returns (address);
    function _isApprovedForAll721(address owner, address operator) internal view virtual returns (bool);
    function _transfer721(address from, address to, uint256 tokenId) internal virtual;
    function _realEstateToken() internal view virtual returns (PropVeraFractionalToken);

    modifier onlyAdminFrac() {
        if (!isAdmin[msg.sender]) revert PropVeraErrors.NotAdmin(msg.sender);
        _;
    }

    // ── Fractional asset creation ─────────────────────────────────────────────

    /// @notice Admin: tokenise an asset into fractional shares.
    /// @param tokenId         The NFT to fractionalize.
    /// @param totalTokensInEth Total shares to issue (whole tokens, converted to wei).
    function createFractionalAsset(uint256 tokenId, uint256 totalTokensInEth) external onlyAdminFrac {
        PropVeraTypes.RealEstateAsset storage asset = realEstateAssets[tokenId];

        // Cache SLOADs
        address seller   = asset.seller;
        bool sold        = asset.sold;
        bool verified    = asset.verified;
        uint256 price    = asset.price;

        if (seller == address(0)) revert PropVeraErrors.AssetDoesNotExist();
        if (sold)                 revert PropVeraErrors.AssetAlreadySold();
        if (!verified)            revert PropVeraErrors.AssetNotVerified();
        if (_ownerOf721(tokenId) != seller) revert PropVeraErrors.SellerNotOwner();
        if (
            _getApproved721(tokenId) != address(this) &&
            !_isApprovedForAll721(seller, address(this))
        ) revert PropVeraErrors.ContractNotApproved();

        uint256 totalTokensInWei  = ConversionLib.tokenToWei(totalTokensInEth);
        uint256 pricePerTokenInWei = (price * ConversionLib.TOKEN_UNIT) / totalTokensInWei;

        fractionalAssets[tokenId] = PropVeraTypes.FractionalAsset({
            tokenId:       tokenId,
            totalTokens:   totalTokensInWei,
            pricePerToken: pricePerTokenInWei,
            seller:        payable(seller)
        });

        _realEstateToken().mint(address(this), totalTokensInWei);

        emit PropVeraEvents.FractionalAssetCreated(
            tokenId,
            totalTokensInEth,
            ConversionLib.usdcFromWei(pricePerTokenInWei),
            seller
        );
    }

    /// @notice Buy fractional shares of a tokenized asset.
    function buyFractionalAsset(uint256 tokenId, uint256 numTokensInEth) external nonReentrant {
        if (numTokensInEth == 0) revert PropVeraErrors.InvalidAmount();

        PropVeraTypes.FractionalAsset storage fAsset = fractionalAssets[tokenId];

        // Cache
        uint256 pricePerToken = fAsset.pricePerToken;
        uint256 available     = fAsset.totalTokens;

        uint256 numTokensInWei = ConversionLib.tokenToWei(numTokensInEth);
        if (available < numTokensInWei) revert PropVeraErrors.InsufficientTokens();

        uint256 totalPriceInWei = (numTokensInWei * pricePerToken) / ConversionLib.TOKEN_UNIT;

        // CEI: update state before transfers
        fAsset.totalTokens = available - numTokensInWei;
        fractionalPayments[tokenId] += totalPriceInWei;

        bool isFirstBuy = buyerFractions[msg.sender][tokenId] == 0;
        buyerFractions[msg.sender][tokenId] += numTokensInWei;

        if (isFirstBuy) {
            fractionalAssetBuyers[tokenId].push(msg.sender);
        }

        // Transfers
        _usdc().safeTransferFrom(msg.sender, address(this), totalPriceInWei);
        _realEstateToken().safeTransfer(msg.sender, numTokensInWei);

        // Auto-complete: if buyer now holds 100% of total supply
        uint256 totalSupplyWei = (realEstateAssets[tokenId].price * ConversionLib.TOKEN_UNIT) / pricePerToken;
        if (fAsset.totalTokens == 0 && buyerFractions[msg.sender][tokenId] == totalSupplyWei) {
            realEstateAssets[tokenId].sold = true;
            _transfer721(realEstateAssets[tokenId].seller, msg.sender, tokenId);
        }

        emit PropVeraEvents.FractionalAssetPurchased(
            tokenId,
            msg.sender,
            numTokensInEth,
            ConversionLib.usdcFromWei(totalPriceInWei)
        );
    }

    /// @notice Return fractional tokens and receive a USDC refund.
    /// @dev    Requires admin to have first enabled withdrawals via
    ///         `setBuyerCanWithdraw(tokenId, true)`.
    function cancelFractionalAssetPurchase(uint256 tokenId, uint256 numTokensInEth) external nonReentrant {
        if (!buyerCanWithdraw[tokenId])               revert PropVeraErrors.CannotWithdrawYet();

        uint256 ownedWei = buyerFractions[msg.sender][tokenId];
        if (ownedWei == 0)                            revert PropVeraErrors.NoTokensOwned();

        uint256 numTokensInWei = ConversionLib.tokenToWei(numTokensInEth);
        if (ownedWei < numTokensInWei)                revert PropVeraErrors.NotEnoughTokensOwned();

        PropVeraTypes.FractionalAsset storage fAsset = fractionalAssets[tokenId];
        uint256 pricePerToken = fAsset.pricePerToken;
        uint256 refundInWei   = (numTokensInWei * pricePerToken) / ConversionLib.TOKEN_UNIT;

        // CEI: state first
        fAsset.totalTokens += numTokensInWei;
        buyerFractions[msg.sender][tokenId] = ownedWei - numTokensInWei;
        fractionalPayments[tokenId] -= refundInWei;

        // Transfers
        _realEstateToken().safeTransferFrom(msg.sender, address(this), numTokensInWei);
        _usdc().safeTransfer(msg.sender, refundInWei);

        emit PropVeraEvents.AssetCanceled(tokenId, msg.sender);
    }

    /// @notice Admin: push USDC dividends to all current fractional holders.
    /// @dev    ⚠ PUSH PATTERN — loop over all holders. See module-level note.
    function distributeFractionalDividends(uint256 tokenId, uint256 amountInEth)
        external
        onlyAdminFrac
        nonReentrant
    {
        if (fractionalAssets[tokenId].seller == address(0)) revert PropVeraErrors.FractionalAssetDoesNotExist();
        if (amountInEth == 0)                               revert PropVeraErrors.InvalidAmount();

        uint256 amountInWei = ConversionLib.usdcToWei(amountInEth);
        if (_usdc().balanceOf(address(this)) < amountInWei) revert PropVeraErrors.InsufficientUSDCBalance();

        // Determine total issued tokens
        PropVeraTypes.FractionalAsset storage fAsset = fractionalAssets[tokenId];
        uint256 totalTokensInWei;
        if (realEstateAssets[tokenId].sold) {
            totalTokensInWei = (realEstateAssets[tokenId].price * ConversionLib.TOKEN_UNIT) / fAsset.pricePerToken;
        } else {
            address[] storage buyers = fractionalAssetBuyers[tokenId];
            uint256 firstHolderBal   = buyers.length > 0 ? buyerFractions[buyers[0]][tokenId] : 0;
            totalTokensInWei         = fAsset.totalTokens + firstHolderBal;
        }
        if (totalTokensInWei == 0) revert PropVeraErrors.NoTokensIssued();

        address[] storage buyerList = fractionalAssetBuyers[tokenId];
        uint256 len = buyerList.length;

        address[] memory buyersOut  = new address[](len);
        uint256[] memory amountsOut = new uint256[](len);
        uint256 distributed;

        for (uint256 i; i < len; ) {
            address buyer      = buyerList[i];          // 1 SLOAD per iteration
            uint256 holderBal  = buyerFractions[buyer][tokenId]; // 1 SLOAD
            if (holderBal > 0) {
                uint256 share  = (amountInWei * holderBal) / totalTokensInWei;
                buyersOut[i]   = buyer;
                amountsOut[i]  = ConversionLib.usdcFromWei(share);
                distributed    += share;
                _usdc().safeTransfer(buyer, share);
            }
            unchecked { ++i; }
        }

        // Return unallocated dust to the contract's own balance (no-op transfer to self)
        if (distributed < amountInWei) {
            // Dust stays in the contract — no self-transfer required.
        }

        emit PropVeraEvents.FractionalDividendsDistributed(tokenId, amountInEth, buyersOut, amountsOut);
    }

    /// @notice Admin toggle: allow/block fractional refunds for a given asset.
    function setBuyerCanWithdraw(uint256 tokenId, bool canWithdraw) external onlyAdminFrac {
        buyerCanWithdraw[tokenId] = canWithdraw;
    }

    // ── View functions ────────────────────────────────────────────────────────

    function getBuyerFractions(address buyer, uint256 tokenId) external view returns (uint256) {
        return ConversionLib.tokenFromWei(buyerFractions[buyer][tokenId]);
    }

    function getFractionalAssetBuyersList(uint256 tokenId) external view returns (address[] memory) {
        return fractionalAssetBuyers[tokenId];
    }

    function getFractionalPayments(uint256 tokenId) external view returns (uint256) {
        return ConversionLib.usdcFromWei(fractionalPayments[tokenId]);
    }

    function fetchFractionalAssetBuyers(uint256 tokenId)
        external
        view
        returns (PropVeraTypes.FractionalBuyer[] memory)
    {
        PropVeraTypes.FractionalAsset storage fAsset = fractionalAssets[tokenId];
        if (fAsset.seller == address(0)) revert PropVeraErrors.FractionalAssetDoesNotExist();

        address[] storage buyers = fractionalAssetBuyers[tokenId];
        uint256 len              = buyers.length;

        uint256 totalTokensInWei;
        if (realEstateAssets[tokenId].sold) {
            totalTokensInWei = (realEstateAssets[tokenId].price * ConversionLib.TOKEN_UNIT) / fAsset.pricePerToken;
        } else {
            uint256 firstBal  = len > 0 ? buyerFractions[buyers[0]][tokenId] : 0;
            totalTokensInWei  = fAsset.totalTokens + firstBal;
        }

        PropVeraTypes.FractionalBuyer[] memory result = new PropVeraTypes.FractionalBuyer[](len);

        for (uint256 i; i < len; ) {
            address addr       = buyers[i];
            uint256 bal        = buyerFractions[addr][tokenId];
            uint256 pct        = totalTokensInWei > 0
                ? (bal * _PERCENT_DENOM * _PERCENTAGE_SCALE) / totalTokensInWei
                : 0;
            result[i] = PropVeraTypes.FractionalBuyer({
                buyer:     addr,
                numTokens: ConversionLib.tokenFromWei(bal),
                percentage: pct
            });
            unchecked { ++i; }
        }
        return result;
    }
}
