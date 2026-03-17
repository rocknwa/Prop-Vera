// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./modules/AssetMarketplace.sol";
import "./modules/Fractionalization.sol";
import "./modules/ShareTrading.sol";
import "./tokens/PropVeraFractionalToken.sol";
import "./errors/PropVeraErrors.sol";
import "./events/PropVeraEvents.sol";
import "./libraries/ConversionLib.sol";
import "./types/PropVeraTypes.sol";

/// @title PropVera
/// @notice Decentralized real-estate NFT marketplace with fractional ownership
///         and a peer-to-peer secondary share market.
///
/// @dev    Architecture
///         ─────────────────────────────────────────────────────────────────────
///         PropVera inherits three abstract modules that share the same storage
///         layout via PropVeraStorage:
///           • AssetMarketplace  — whole-asset listing & purchase flow
///           • Fractionalization — tokenised fractional shares & dividends
///           • ShareTrading      — P2P secondary market for fractional shares
///
///         The modules declare abstract internal function signatures that
///         PropVera.sol satisfies below, bridging ERC-721 and token state into
///         each module without duplicating logic.
///
///         Gas-optimisation highlights
///         ─────────────────────────────────────────────────────────────────────
///         • Immutable token references → SLOAD replaced by PUSH20 (cheaper).
///         • Module hooks are `internal` → inlined, zero call overhead.
///         • All `public` view/pure functions that are only called externally
///           are declared `external` so calldata is used instead of memory.
///         • Loop counters use `unchecked { ++i }`.
///         • Storage variables cached in locals before use in multi-read paths.
///
contract PropVera is
    Ownable,
    ERC721URIStorage,
    ERC721Holder,
    AssetMarketplace,
    Fractionalization,
    ShareTrading
{
    using SafeERC20 for IERC20;

    // ── Immutable token references ────────────────────────────────────────────
    /// @dev Stored as immutable: costs one PUSH20 per read instead of SLOAD.
    PropVeraFractionalToken public immutable realEstateToken;
    IERC20 public immutable usdcToken;

    // ── Constructor ───────────────────────────────────────────────────────────
    constructor(
        address realEstateTokenAddr,
        address _usdcToken
    ) ERC721("PropVeraAssetToken", "PVT") Ownable(msg.sender) {
        realEstateToken = PropVeraFractionalToken(realEstateTokenAddr);
        usdcToken = IERC20(_usdcToken);
    }

    // ── Admin management (owner-only) ─────────────────────────────────────────

    function addAdmin(address _admin) external onlyOwner {
        if (isAdmin[_admin]) revert PropVeraErrors.AdminAlreadyExists();
        isAdmin[_admin] = true;
    }

    function removeAdmin(address _admin) external onlyOwner {
        if (!isAdmin[_admin]) revert PropVeraErrors.AdminDoesNotExist();
        isAdmin[_admin] = false;
    }

    // ── Treasury ──────────────────────────────────────────────────────────────

    /// @notice Owner: withdraw USDC from the contract.
    /// @param recipient Destination address.
    /// @param amountInEth Whole-USDC amount to withdraw.
    function withdrawUSDC(
        address recipient,
        uint256 amountInEth
    ) external onlyOwner nonReentrant {
        if (recipient == address(0)) revert PropVeraErrors.InvalidRecipient();
        if (amountInEth == 0) revert PropVeraErrors.InvalidAmount();

        uint256 amountInWei = ConversionLib.usdcToWei(amountInEth);
        if (usdcToken.balanceOf(address(this)) < amountInWei)
            revert PropVeraErrors.InsufficientUSDCBalance();

        usdcToken.safeTransfer(recipient, amountInWei);
        emit PropVeraEvents.USDCWithdrawn(recipient, amountInEth);
    }

    // ── Display / view aggregators ────────────────────────────────────────────

    /// @notice Comprehensive display info for a single asset (prices in ETH).
    function getAssetDisplayInfo(
        uint256 tokenId
    ) external view returns (PropVeraTypes.AssetDisplayInfo memory) {
        return _buildDisplayInfo(tokenId);
    }

    /// @notice All listed assets with display info.
    function fetchAllAssetsWithDisplayInfo()
        external
        view
        returns (PropVeraTypes.AssetDisplayInfo[] memory)
    {
        uint256 total = _tokenIds;
        PropVeraTypes.AssetDisplayInfo[]
            memory items = new PropVeraTypes.AssetDisplayInfo[](total);
        uint256 count;

        for (uint256 i = 1; i <= total; ) {
            if (realEstateAssets[i].seller != address(0)) {
                items[count] = _buildDisplayInfo(i);
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

    /// @notice Verified, unsold assets only.
    function fetchAvailableAssets()
        external
        view
        returns (PropVeraTypes.AssetDisplayInfo[] memory)
    {
        uint256 total = _tokenIds;
        uint256 avail;
        for (uint256 i = 1; i <= total; ) {
            PropVeraTypes.RealEstateAsset storage a = realEstateAssets[i];
            if (a.seller != address(0) && !a.sold && a.verified) {
                unchecked {
                    ++avail;
                }
            }
            unchecked {
                ++i;
            }
        }

        PropVeraTypes.AssetDisplayInfo[]
            memory items = new PropVeraTypes.AssetDisplayInfo[](avail);
        uint256 idx;
        for (uint256 i = 1; i <= total; ) {
            PropVeraTypes.RealEstateAsset storage a = realEstateAssets[i];
            if (a.seller != address(0) && !a.sold && a.verified) {
                items[idx] = _buildDisplayInfo(i);
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

    /// @notice All fractionalized assets.
    function fetchFractionalizedAssets()
        external
        view
        returns (PropVeraTypes.AssetDisplayInfo[] memory)
    {
        uint256 total = _tokenIds;
        uint256 cnt;
        for (uint256 i = 1; i <= total; ) {
            if (fractionalAssets[i].seller != address(0)) {
                unchecked {
                    ++cnt;
                }
            }
            unchecked {
                ++i;
            }
        }

        PropVeraTypes.AssetDisplayInfo[]
            memory items = new PropVeraTypes.AssetDisplayInfo[](cnt);
        uint256 idx;
        for (uint256 i = 1; i <= total; ) {
            if (fractionalAssets[i].seller != address(0)) {
                items[idx] = _buildDisplayInfo(i);
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

    /// @notice Buyer's portfolio of all fractional investments.
    function getBuyerPortfolio(
        address buyer
    ) external view returns (PropVeraTypes.BuyerPortfolio[] memory) {
        uint256 total = _tokenIds;
        uint256 cnt;
        for (uint256 i = 1; i <= total; ) {
            if (buyerFractions[buyer][i] > 0) {
                unchecked {
                    ++cnt;
                }
            }
            unchecked {
                ++i;
            }
        }

        PropVeraTypes.BuyerPortfolio[]
            memory portfolio = new PropVeraTypes.BuyerPortfolio[](cnt);
        uint256 idx;

        for (uint256 i = 1; i <= total; ) {
            uint256 owned = buyerFractions[buyer][i];
            if (owned > 0) {
                PropVeraTypes.FractionalAsset storage fAsset = fractionalAssets[
                    i
                ];
                uint256 ppt = fAsset.pricePerToken;
                uint256 totalSupply = (realEstateAssets[i].price *
                    ConversionLib.TOKEN_UNIT) / ppt;
                uint256 pct = (owned * 100 * _PERCENTAGE_SCALE) / totalSupply;
                uint256 valueWei = (owned * ppt) / ConversionLib.TOKEN_UNIT;

                portfolio[idx] = PropVeraTypes.BuyerPortfolio({
                    tokenId: i,
                    fractionalTokensOwned: ConversionLib.tokenFromWei(owned),
                    ownershipPercentage: pct,
                    investmentValueInEth: ConversionLib.usdcFromWei(valueWei)
                });
                unchecked {
                    ++idx;
                }
            }
            unchecked {
                ++i;
            }
        }
        return portfolio;
    }

    /// @notice All assets listed by a specific seller.
    function getSellerAssets(
        address seller
    ) external view returns (PropVeraTypes.AssetDisplayInfo[] memory) {
        uint256 total = _tokenIds;
        uint256 cnt;
        for (uint256 i = 1; i <= total; ) {
            if (realEstateAssets[i].seller == seller) {
                unchecked {
                    ++cnt;
                }
            }
            unchecked {
                ++i;
            }
        }

        PropVeraTypes.AssetDisplayInfo[]
            memory items = new PropVeraTypes.AssetDisplayInfo[](cnt);
        uint256 idx;
        for (uint256 i = 1; i <= total; ) {
            if (realEstateAssets[i].seller == seller) {
                items[idx] = _buildDisplayInfo(i);
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

    // ── Internal: build AssetDisplayInfo ─────────────────────────────────────

    /// @dev Single function to assemble display data, avoiding duplicate reads.
    function _buildDisplayInfo(
        uint256 tokenId
    ) internal view returns (PropVeraTypes.AssetDisplayInfo memory info) {
        PropVeraTypes.RealEstateAsset storage asset = realEstateAssets[tokenId];
        PropVeraTypes.FractionalAsset storage fAsset = fractionalAssets[
            tokenId
        ];

        bool isFrac = fAsset.seller != address(0);
        uint256 price = asset.price; // 1 SLOAD
        uint256 ppt = fAsset.pricePerToken; // 1 SLOAD (0 if not frac)

        info.tokenId = tokenId;
        info.priceInEth = ConversionLib.usdcFromWei(price);
        info.seller = asset.seller;
        info.sold = asset.sold;
        info.verified = asset.verified;
        info.isPaidFor = assetPaidFor[tokenId];
        info.isCanceled = assetCanceled[tokenId];
        info.currentBuyer = assetBuyers[tokenId];
        info.tokenURI = tokenURI(tokenId);
        info.isFractionalized = isFrac;

        if (isFrac) {
            uint256 totalWei = (price * ConversionLib.TOKEN_UNIT) / ppt;
            info.totalFractionalTokens = ConversionLib.tokenFromWei(totalWei);
            info.remainingFractionalTokens = ConversionLib.tokenFromWei(
                fAsset.totalTokens
            );
            info.pricePerFractionalTokenInEth = ConversionLib.usdcFromWei(ppt);
            info.accumulatedFractionalPaymentsInEth = ConversionLib.usdcFromWei(
                fractionalPayments[tokenId]
            );
        }
    }

    // ── Module bridge: satisfy abstract stubs ─────────────────────────────────

    function _usdc()
        internal
        view
        override(AssetMarketplace, Fractionalization, ShareTrading)
        returns (IERC20)
    {
        return usdcToken;
    }

    function _owner()
        internal
        view
        override(AssetMarketplace, Fractionalization, ShareTrading)
        returns (address)
    {
        return owner();
    }

    function _realEstateToken()
        internal
        view
        override(Fractionalization, ShareTrading)
        returns (PropVeraFractionalToken)
    {
        return realEstateToken;
    }

    function _ownerOf721(
        uint256 tokenId
    )
        internal
        view
        override(AssetMarketplace, Fractionalization)
        returns (address)
    {
        return ownerOf(tokenId);
    }

    function _getApproved721(
        uint256 tokenId
    )
        internal
        view
        override(AssetMarketplace, Fractionalization)
        returns (address)
    {
        return getApproved(tokenId);
    }

    function _isApprovedForAll721(
        address assetOwner,
        address operator
    )
        internal
        view
        override(AssetMarketplace, Fractionalization)
        returns (bool)
    {
        return isApprovedForAll(assetOwner, operator);
    }

    function _transfer721(
        address from,
        address to,
        uint256 tokenId
    ) internal override(AssetMarketplace, Fractionalization) {
        _transfer(from, to, tokenId);
    }

    function _approve721(
        address to,
        uint256 tokenId
    ) internal override(AssetMarketplace) {
        _approve(to, tokenId, msg.sender);
    }

    function _mintAssetToken(
        address to,
        uint256 tokenId,
        string calldata uri
    ) internal override(AssetMarketplace) {
        _mint(to, tokenId);
        _setTokenURI(tokenId, uri);
        approve(address(this), tokenId);
    }

    // ── ERC-721 override (ERC721URIStorage only) ────────────────────────────────

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721URIStorage) returns (string memory) {
        return ERC721URIStorage.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
