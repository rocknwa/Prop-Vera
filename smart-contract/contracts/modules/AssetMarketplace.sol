// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../storage/PropVeraStorage.sol";
import "../errors/PropVeraErrors.sol";
import "../events/PropVeraEvents.sol";
import "../libraries/ConversionLib.sol";
import "../types/PropVeraTypes.sol";

/// @title AssetMarketplace
/// @notice Handles whole-asset listing, verification, purchase, confirmation,
///         and cancellation flows.
/// @dev    Inherits PropVeraStorage so it shares the same storage layout as
///         the other modules when all are composed into PropVera.sol.
abstract contract AssetMarketplace is PropVeraStorage, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using ConversionLib for uint256;

    // ── Constants shared within this module ──────────────────────────────────
    uint256 internal constant LISTING_FEE_PERCENTAGE = 3;
    uint256 internal constant CANCELLATION_PENALTY_PERCENTAGE = 1;
    uint256 internal constant PERCENTAGE_DENOMINATOR = 100;
    uint256 internal constant START_TOKEN_ID = 1;

    // ── Abstract references (provided by PropVera.sol) ───────────────────────
    /// @dev Returns the USDC token reference.
    function _usdc() internal view virtual returns (IERC20);

    /// @dev Returns the contract owner (Ownable).
    function _owner() internal view virtual returns (address);

    /// @dev Calls ERC-721 ownerOf.
    function _ownerOf721(
        uint256 tokenId
    ) internal view virtual returns (address);

    /// @dev Calls ERC-721 getApproved.
    function _getApproved721(
        uint256 tokenId
    ) internal view virtual returns (address);

    /// @dev Calls ERC-721 isApprovedForAll.
    function _isApprovedForAll721(
        address owner,
        address operator
    ) internal view virtual returns (bool);

    /// @dev Calls internal ERC-721 _transfer.
    function _transfer721(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual;

    /// @dev Calls internal ERC-721 _approve.
    function _approve721(address to, uint256 tokenId) internal virtual;

    /// @dev Calls internal ERC-721 _mint then _setTokenURI.
    function _mintAssetToken(
        address to,
        uint256 tokenId,
        string calldata uri
    ) internal virtual;

    // ── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyAdminMod() {
        if (!isAdmin[msg.sender]) revert PropVeraErrors.NotAdmin(msg.sender);
        _;
    }

    // ── Seller registration ──────────────────────────────────────────────────

    function registerSeller() external {
        if (sellers[msg.sender])
            revert PropVeraErrors.SellerAlreadyRegistered();
        sellers[msg.sender] = true;
        emit PropVeraEvents.SellerRegistered(msg.sender);
    }

    // ── Asset lifecycle ──────────────────────────────────────────────────────

    /// @notice Create a new real-estate NFT listing.
    function createAsset(
        string calldata _tokenURI,
        uint256 _priceInEth
    ) external {
        if (!sellers[msg.sender]) revert PropVeraErrors.SellerNotRegistered();
        if (_priceInEth == 0) revert PropVeraErrors.InvalidPrice();

        unchecked {
            ++_tokenIds;
        }
        uint256 newTokenId = _tokenIds;
        uint256 priceInWei = ConversionLib.usdcToWei(_priceInEth);

        _mintAssetToken(msg.sender, newTokenId, _tokenURI);

        realEstateAssets[newTokenId] = PropVeraTypes.RealEstateAsset({
            tokenId: newTokenId,
            price: priceInWei,
            seller: payable(msg.sender),
            sold: false,
            verified: false
        });

        emit PropVeraEvents.AssetCreated(
            newTokenId,
            _priceInEth,
            msg.sender,
            false
        );
    }

    /// @notice Admin: mark an asset as verified so it can be purchased.
    function verifyAsset(uint256 tokenId) external onlyAdminMod {
        PropVeraTypes.RealEstateAsset storage asset = realEstateAssets[tokenId];
        if (asset.seller == address(0))
            revert PropVeraErrors.AssetDoesNotExist();
        if (asset.verified) revert PropVeraErrors.AssetAlreadyVerified();

        asset.verified = true;
        emit PropVeraEvents.AssetVerified(tokenId, asset.seller);
    }

    /// @notice Admin: force-delist any asset.
    function delistAssetAdmin(
        uint256 tokenId
    ) external onlyAdminMod nonReentrant {
        _delistAsset(tokenId);
    }

    /// @notice Seller: delist their own asset.
    function delistAsset(uint256 tokenId) external nonReentrant {
        if (realEstateAssets[tokenId].seller != msg.sender)
            revert PropVeraErrors.SellerNotOwner();
        _delistAsset(tokenId);
    }

    function _delistAsset(uint256 tokenId) internal {
        PropVeraTypes.RealEstateAsset storage asset = realEstateAssets[tokenId];
        if (asset.seller == address(0))
            revert PropVeraErrors.AssetDoesNotExist();
        if (asset.sold) revert PropVeraErrors.AssetAlreadySold();
        if (
            fractionalAssets[tokenId].totalTokens > 0 ||
            fractionalAssetBuyers[tokenId].length > 0
        ) revert PropVeraErrors.FractionalizedAssetWithBuyers();

        // Cache to avoid multiple SLOADs
        bool isPaid = assetPaidFor[tokenId];
        address payable buyer = assetBuyers[tokenId];
        uint256 price = asset.price;
        address seller = asset.seller;

        if (isPaid) {
            // Refund buyer — CEI: clear state before transfer
            assetPaidFor[tokenId] = false;
            assetBuyers[tokenId] = payable(address(0));
            assetCanceled[tokenId] = true;
            unchecked {
                ++sellerCanceledPurchases[seller];
            }
            _usdc().safeTransfer(buyer, price);
        }

        // Remove NFT approval
        if (_getApproved721(tokenId) == address(this)) {
            _approve721(address(0), tokenId);
        }

        delete realEstateAssets[tokenId];
        emit PropVeraEvents.AssetDelisted(tokenId, seller);
    }

    // ── Purchase flow ────────────────────────────────────────────────────────

    /// @notice Buyer: pay for an asset (locks funds in escrow).
    function buyAsset(uint256 tokenId) external {
        PropVeraTypes.RealEstateAsset storage asset = realEstateAssets[tokenId];

        // Cache storage reads
        address seller = asset.seller;
        bool sold = asset.sold;
        bool verified = asset.verified;

        if (sold) revert PropVeraErrors.AssetAlreadySold();
        if (seller == msg.sender) revert PropVeraErrors.NotBuyer();
        if (assetPaidFor[tokenId]) revert PropVeraErrors.AssetAlreadyPaid();
        if (!verified) revert PropVeraErrors.AssetNotVerified();
        if (_ownerOf721(tokenId) != seller)
            revert PropVeraErrors.SellerNotOwner();
        if (
            _getApproved721(tokenId) != address(this) &&
            !_isApprovedForAll721(seller, address(this))
        ) revert PropVeraErrors.ContractNotApproved();

        uint256 price = asset.price; // 1 SLOAD

        // CEI: update state before external call
        assetPaidFor[tokenId] = true;
        assetBuyers[tokenId] = payable(msg.sender);

        _usdc().safeTransferFrom(msg.sender, address(this), price);

        emit PropVeraEvents.AssetPurchased(
            tokenId,
            msg.sender,
            ConversionLib.usdcFromWei(price)
        );
    }

    /// @notice Buyer: confirm receipt — releases funds to seller, transfers NFT.
    function confirmAssetPayment(uint256 tokenId) external nonReentrant {
        if (assetBuyers[tokenId] != msg.sender)
            revert PropVeraErrors.NotBuyer();

        PropVeraTypes.RealEstateAsset storage asset = realEstateAssets[tokenId];

        // Cache SLOADs
        bool paid = assetPaidFor[tokenId];
        bool sold = asset.sold;
        bool verified = asset.verified;
        address seller = asset.seller;
        uint256 price = asset.price;

        if (!paid) revert PropVeraErrors.AssetNotPaid();
        if (sold) revert PropVeraErrors.AssetAlreadySold();
        if (!verified) revert PropVeraErrors.AssetNotVerified();
        if (_ownerOf721(tokenId) != seller)
            revert PropVeraErrors.SellerNotOwner();
        if (
            _getApproved721(tokenId) != address(this) &&
            !_isApprovedForAll721(seller, address(this))
        ) revert PropVeraErrors.ContractNotApproved();

        uint256 listingFee = (price * LISTING_FEE_PERCENTAGE) /
            PERCENTAGE_DENOMINATOR;
        uint256 paymentToSeller = price - listingFee;

        // CEI: state changes first
        asset.sold = true;
        unchecked {
            ++sellerConfirmedPurchases[seller];
        }

        // Transfers
        _usdc().safeTransfer(seller, paymentToSeller);
        _usdc().safeTransfer(_owner(), listingFee);
        _transfer721(seller, msg.sender, tokenId);

        emit PropVeraEvents.AssetPaymentConfirmed(tokenId, msg.sender);
    }

    /// @notice Buyer: cancel purchase — refund minus penalty.
    function cancelAssetPurchase(uint256 tokenId) external nonReentrant {
        if (assetBuyers[tokenId] != msg.sender)
            revert PropVeraErrors.NotBuyer();

        PropVeraTypes.RealEstateAsset storage asset = realEstateAssets[tokenId];

        if (!assetPaidFor[tokenId]) revert PropVeraErrors.AssetNotPaid();
        if (asset.sold) revert PropVeraErrors.AssetAlreadySold();

        uint256 price = asset.price;
        address seller = asset.seller;
        uint256 penalty = (price * CANCELLATION_PENALTY_PERCENTAGE) /
            PERCENTAGE_DENOMINATOR;
        uint256 refund = price - penalty;

        // CEI: state before transfers
        assetPaidFor[tokenId] = false;
        assetCanceled[tokenId] = true;
        unchecked {
            ++sellerCanceledPurchases[seller];
        }

        _usdc().safeTransfer(msg.sender, refund);
        _usdc().safeTransfer(_owner(), penalty);

        emit PropVeraEvents.AssetCanceled(tokenId, msg.sender);
    }

    // ── View helpers ─────────────────────────────────────────────────────────

    function isAssetPaidFor(uint256 tokenId) external view returns (bool) {
        return assetPaidFor[tokenId];
    }

    function getAssetBuyer(uint256 tokenId) external view returns (address) {
        return assetBuyers[tokenId];
    }

    function isAssetCanceled(uint256 tokenId) external view returns (bool) {
        return assetCanceled[tokenId];
    }

    function getSellerMetrics(
        address sellerAddress
    ) external view returns (uint256, uint256) {
        return (
            sellerConfirmedPurchases[sellerAddress],
            sellerCanceledPurchases[sellerAddress]
        );
    }

    /// @notice Fetch single asset — price returned in ETH for display.
    function fetchAsset(
        uint256 tokenId
    ) external view returns (PropVeraTypes.RealEstateAsset memory) {
        PropVeraTypes.RealEstateAsset memory asset = realEstateAssets[tokenId];
        asset.price = ConversionLib.usdcFromWei(asset.price);
        return asset;
    }

    /// @notice Fetch all listed assets — prices in ETH.
    function fetchAllListedAssets()
        external
        view
        returns (PropVeraTypes.RealEstateAsset[] memory)
    {
        uint256 total = _tokenIds;
        PropVeraTypes.RealEstateAsset[]
            memory items = new PropVeraTypes.RealEstateAsset[](total);
        uint256 count;

        for (uint256 i = START_TOKEN_ID; i <= total; ) {
            PropVeraTypes.RealEstateAsset storage cur = realEstateAssets[i];
            if (cur.seller != address(0)) {
                PropVeraTypes.RealEstateAsset memory m = cur;
                m.price = ConversionLib.usdcFromWei(m.price);
                items[count] = m;
                unchecked {
                    ++count;
                }
            }
            unchecked {
                ++i;
            }
        }

        assembly {
            mstore(items, count)
        }
        return items;
    }

    /// @notice Fetch unsold assets — prices in ETH.
    function fetchUnsoldAssets()
        external
        view
        returns (PropVeraTypes.RealEstateAsset[] memory)
    {
        uint256 total = _tokenIds;
        // Count first to size array correctly
        uint256 unsoldCount;
        for (uint256 i = START_TOKEN_ID; i <= total; ) {
            PropVeraTypes.RealEstateAsset storage cur = realEstateAssets[i];
            if (!cur.sold && cur.seller != address(0)) {
                unchecked {
                    ++unsoldCount;
                }
            }
            unchecked {
                ++i;
            }
        }

        PropVeraTypes.RealEstateAsset[]
            memory items = new PropVeraTypes.RealEstateAsset[](unsoldCount);
        uint256 idx;
        for (uint256 i = START_TOKEN_ID; i <= total; ) {
            PropVeraTypes.RealEstateAsset storage cur = realEstateAssets[i];
            if (!cur.sold && cur.seller != address(0)) {
                PropVeraTypes.RealEstateAsset memory m = cur;
                m.price = ConversionLib.usdcFromWei(m.price);
                items[idx] = m;
                unchecked {
                    ++idx;
                }
            }
            unchecked {
                ++i;
            }
        }
        return items;
    }
}
