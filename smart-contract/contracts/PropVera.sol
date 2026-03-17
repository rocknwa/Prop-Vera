// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./PropVeraFractionalToken.sol";

/// @title PropVera - A Real Estate NFT Marketplace with Fractional Ownership
/// @author Therock Ani
/// @notice A decentralized application for trading real estate assets as NFTs with fractional ownership and dividend distribution.
/// @dev All prices are displayed in ETH but stored internally in wei (6 decimals for USDC, 18 decimals for tokens)
contract PropVera is Ownable, ERC721URIStorage, ERC721Holder, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using SafeERC20 for PropVeraFractionalToken;

    // --- Constants ---
    uint256 public constant LISTING_FEE_PERCENTAGE = 3;
    uint256 public constant CANCELLATION_PENALTY_PERCENTAGE = 1;
    uint256 public constant SHARE_TRADING_FEE_PERCENTAGE = 2; // 2% fee for share trades
    uint256 private constant PERCENTAGE_DENOMINATOR = 100;
    uint256 private constant PERCENTAGE_SCALE = 1e18;
    uint256 private constant START_TOKEN_ID = 1;
    uint256 private constant ZERO_AMOUNT = 0;
    address private constant ZERO_ADDRESS = address(0);
    uint256 private constant USDC_DECIMALS = 6; // USDC has 6 decimals
    uint256 private constant USDC_UNIT = 1e6; // 1 USDC in wei
    uint256 private constant TOKEN_DECIMALS = 18; // Fractional tokens have 18 decimals
    uint256 private constant TOKEN_UNIT = 1e18; // 1 Token in wei

    // --- State Variables ---
    uint256 private _tokenIds;
    uint256 private _shareListingIds;
    PropVeraFractionalToken public immutable realEstateToken;
    IERC20 public immutable usdcToken;

    // PUBLIC mappings for direct UI access
    mapping(uint256 => RealEstateAsset) public realEstateAssets;
    mapping(address => bool) public sellers;
    mapping(uint256 => FractionalAsset) public fractionalAssets;
    mapping(address => bool) public isAdmin;
    mapping(uint256 => ShareListing) public shareListings; // listingId => ShareListing

    // PRIVATE mappings with getter functions
    mapping(address => uint256) private sellerConfirmedPurchases;
    mapping(address => uint256) private sellerCanceledPurchases;
    mapping(uint256 => bool) private assetPaidFor;
    mapping(uint256 => address payable) private assetBuyers;
    mapping(uint256 => bool) private assetCanceled;
    mapping(address => mapping(uint256 => uint256)) private buyerFractions; // Stored in wei (18 decimals)
    mapping(uint256 => address[]) private fractionalAssetBuyers;
    mapping(uint256 => uint256) private fractionalPayments;
    mapping(uint256 => uint256[]) private assetShareListings; // tokenId => array of listingIds
    mapping(uint256 => bool) public buyerCanWithdraw; // tokenId => bool

    // --- Structs ---
    struct RealEstateAsset {
        uint256 tokenId;
        uint256 price; // Stored in USDC wei (6 decimals)
        address payable seller;
        bool sold;
        bool verified;
    }

    struct FractionalAsset {
        uint256 tokenId;
        uint256 totalTokens; // Stored in token wei (18 decimals)
        uint256 pricePerToken; // Stored in USDC wei (6 decimals)
        address payable seller;
    }

    struct FractionalBuyer {
        address buyer;
        uint256 numTokens; // Returned in ETH (divided by 1e18)
        uint256 percentage;
    }

    struct ShareListing {
        uint256 listingId;
        uint256 tokenId;
        address seller;
        uint256 numShares; // Stored in token wei (18 decimals)
        uint256 pricePerShare; // Stored in USDC wei (6 decimals)
        bool active;
    }

    /// @notice Extended asset info for UI display (prices in ETH)
    struct AssetDisplayInfo {
        uint256 tokenId;
        uint256 priceInEth; // USDC price in ETH (divided by 1e6)
        address seller;
        bool sold;
        bool verified;
        bool isPaidFor;
        bool isCanceled;
        address currentBuyer;
        string tokenURI;
        bool isFractionalized;
        uint256 totalFractionalTokens; // Token amount in ETH (divided by 1e18)
        uint256 remainingFractionalTokens; // Token amount in ETH (divided by 1e18)
        uint256 pricePerFractionalTokenInEth; // USDC price in ETH (divided by 1e6)
        uint256 accumulatedFractionalPaymentsInEth; // USDC amount in ETH (divided by 1e6)
    }

    /// @notice Buyer's portfolio item (values in ETH)
    struct BuyerPortfolio {
        uint256 tokenId;
        uint256 fractionalTokensOwned; // Token amount in ETH (divided by 1e18)
        uint256 ownershipPercentage;
        uint256 investmentValueInEth; // USDC value in ETH (divided by 1e6)
    }

    // --- Custom Errors ---
    error SellerAlreadyRegistered();
    error SellerNotRegistered();
    error InvalidPrice();
    error AssetDoesNotExist();
    error AssetAlreadyVerified();
    error AssetAlreadySold();
    error FractionalizedAssetWithBuyers();
    error InsufficientTokens();
    error NoTokensOwned();
    error InvalidAmount();
    error InvalidRecipient();
    error InsufficientUSDCBalance();
    error AssetAlreadyPaid();
    error NotBuyer();
    error AssetNotPaid();
    error AssetNotVerified();
    error SellerNotOwner();
    error ContractNotApproved();
    error NoTokensIssued();
    error FractionalAssetDoesNotExist();
    error NotAdmin(address);
    error NotEnoughTokensOwned();
    error ShareListingNotFound();
    error ShareListingNotActive();
    error NotShareSeller();
    error CannotBuyOwnShares();
    error CannotWithdrawYet();
    error AdminAlreadyExists();
    error AdminDoesNotExist();

    // --- Events (prices in ETH for display) ---
    event AssetCreated(uint256 indexed tokenId, uint256 priceInEth, address indexed seller, bool verified);
    event AssetPurchased(uint256 indexed tokenId, address indexed buyer, uint256 priceInEth);
    event FractionalAssetCreated(uint256 indexed tokenId, uint256 totalTokensInEth, uint256 pricePerTokenInEth, address indexed seller);
    event FractionalAssetPurchased(uint256 indexed tokenId, address indexed buyer, uint256 numTokensInEth, uint256 totalPriceInEth);
    event AssetCanceled(uint256 indexed tokenId, address indexed buyer);
    event AssetPaymentConfirmed(uint256 indexed tokenId, address indexed buyer);
    event SellerRegistered(address indexed sellerAddress);
    event USDCWithdrawn(address indexed recipient, uint256 amountInEth);
    event AssetVerified(uint256 indexed tokenId, address indexed seller);
    event AssetDelisted(uint256 indexed tokenId, address indexed seller);
    event FractionalDividendsDistributed(uint256 indexed tokenId, uint256 totalAmountInEth, address[] buyers, uint256[] amounts);
    event SharesTransferred(uint256 indexed tokenId, address indexed from, address indexed to, uint256 numSharesInEth);
    event SharesListed(uint256 indexed listingId, uint256 indexed tokenId, address indexed seller, uint256 numSharesInEth, uint256 pricePerShareInEth);
    event SharesPurchased(uint256 indexed listingId, uint256 indexed tokenId, address indexed buyer, address seller, uint256 numSharesInEth, uint256 totalPriceInEth);
    event ShareListingCanceled(uint256 indexed listingId, uint256 indexed tokenId, address indexed seller);

    constructor(address _realEstateToken, address _usdcToken) ERC721("PropVeraAssetToken", "PVT") {
        realEstateToken = PropVeraFractionalToken(_realEstateToken);
        usdcToken = IERC20(_usdcToken);
    }

    modifier onlyAdmin {
        if(!isAdmin[msg.sender]) revert NotAdmin(msg.sender);
        _;
    }

    // ============================================
    // CONVERSION HELPERS
    // ============================================

    /// @notice Convert USDC ETH to USDC wei (6 decimals)
    /// @param ethAmount Amount in ETH
    /// @return Wei amount (6 decimals)
    function usdcEthToWei(uint256 ethAmount) private pure returns (uint256) {
        return ethAmount * USDC_UNIT;
    }

    /// @notice Convert USDC wei to ETH (6 decimals)
    /// @param weiAmount Amount in wei (6 decimals)
    /// @return ETH amount
    function usdcWeiToEth(uint256 weiAmount) private pure returns (uint256) {
        return weiAmount / USDC_UNIT;
    }

    /// @notice Convert Token ETH to Token wei (18 decimals)
    /// @param ethAmount Amount in ETH
    /// @return Wei amount (18 decimals)
    function tokenEthToWei(uint256 ethAmount) private pure returns (uint256) {
        return ethAmount * TOKEN_UNIT;
    }

    /// @notice Convert Token wei to ETH (18 decimals)
    /// @param weiAmount Amount in wei (18 decimals)
    /// @return ETH amount
    function tokenWeiToEth(uint256 weiAmount) private pure returns (uint256) {
        return weiAmount / TOKEN_UNIT;
    }

    // ============================================
    // GETTER FUNCTIONS FOR UI
    // ============================================

    /// @notice Get if an asset has been paid for
    function isAssetPaidFor(uint256 tokenId) public view returns (bool) {
        return assetPaidFor[tokenId];
    }

    /// @notice Get the buyer of a pending asset purchase
    function getAssetBuyer(uint256 tokenId) public view returns (address) {
        return assetBuyers[tokenId];
    }

    /// @notice Get if an asset purchase was canceled
    function isAssetCanceled(uint256 tokenId) public view returns (bool) {
        return assetCanceled[tokenId];
    }

    /// @notice Get fractional tokens owned by a buyer for a specific asset (in ETH)
    function getBuyerFractions(address buyer, uint256 tokenId) public view returns (uint256) {
        return tokenWeiToEth(buyerFractions[buyer][tokenId]);
    }

    /// @notice Get list of all fractional buyers for an asset
    function getFractionalAssetBuyersList(uint256 tokenId) public view returns (address[] memory) {
        return fractionalAssetBuyers[tokenId];
    }

    /// @notice Get accumulated USDC from fractional purchases (in ETH)
    function getFractionalPayments(uint256 tokenId) public view returns (uint256) {
        return usdcWeiToEth(fractionalPayments[tokenId]);
    }

    /// @notice Get seller metrics
    function getSellerMetrics(address sellerAddress) public view returns (uint256 confirmed, uint256 canceled) {
        return (sellerConfirmedPurchases[sellerAddress], sellerCanceledPurchases[sellerAddress]);
    }

    /// @notice Get all active share listings for a specific asset (prices in ETH)
    function getAssetShareListings(uint256 tokenId) public view returns (ShareListing[] memory) {
        uint256[] memory listingIds = assetShareListings[tokenId];
        uint256 activeCount = 0;

        // Count active listings
        for (uint256 i = 0; i < listingIds.length; i++) {
            if (shareListings[listingIds[i]].active) {
                activeCount++;
            }
        }

        ShareListing[] memory activeListings = new ShareListing[](activeCount);
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < listingIds.length; i++) {
            if (shareListings[listingIds[i]].active) {
                ShareListing memory listing = shareListings[listingIds[i]];
                // Convert to ETH for display
                listing.pricePerShare = usdcWeiToEth(listing.pricePerShare);
                listing.numShares = tokenWeiToEth(listing.numShares);
                activeListings[currentIndex] = listing;
                currentIndex++;
            }
        }

        return activeListings;
    }

    /// @notice Get all active share listings across all assets (prices in ETH)
    function getAllActiveShareListings() public view returns (ShareListing[] memory) {
        uint256 activeCount = 0;

        // Count active listings
        for (uint256 i = 1; i <= _shareListingIds; i++) {
            if (shareListings[i].active) {
                activeCount++;
            }
        }

        ShareListing[] memory activeListings = new ShareListing[](activeCount);
        uint256 currentIndex = 0;

        for (uint256 i = 1; i <= _shareListingIds; i++) {
            if (shareListings[i].active) {
                ShareListing memory listing = shareListings[i];
                // Convert to ETH for display
                listing.pricePerShare = usdcWeiToEth(listing.pricePerShare);
                listing.numShares = tokenWeiToEth(listing.numShares);
                activeListings[currentIndex] = listing;
                currentIndex++;
            }
        }

        return activeListings;
    }

    /// @notice Get comprehensive asset display information for UI (prices in ETH)
    /// @param tokenId The ID of the asset
    /// @return Complete asset information including fractional details
    function getAssetDisplayInfo(uint256 tokenId) public view returns (AssetDisplayInfo memory) {
        RealEstateAsset memory asset = realEstateAssets[tokenId];
        FractionalAsset memory fractional = fractionalAssets[tokenId];
        
        bool isFractionalized = fractional.seller != ZERO_ADDRESS;
        
        return AssetDisplayInfo({
            tokenId: tokenId,
            priceInEth: usdcWeiToEth(asset.price),
            seller: asset.seller,
            sold: asset.sold,
            verified: asset.verified,
            isPaidFor: assetPaidFor[tokenId],
            isCanceled: assetCanceled[tokenId],
            currentBuyer: assetBuyers[tokenId],
            tokenURI: tokenURI(tokenId),
            isFractionalized: isFractionalized,
            totalFractionalTokens: isFractionalized ? tokenWeiToEth((asset.price * TOKEN_UNIT) / fractional.pricePerToken) : 0,
            remainingFractionalTokens: tokenWeiToEth(fractional.totalTokens),
            pricePerFractionalTokenInEth: isFractionalized ? usdcWeiToEth(fractional.pricePerToken) : 0,
            accumulatedFractionalPaymentsInEth: usdcWeiToEth(fractionalPayments[tokenId])
        });
    }

    /// @notice Get all assets with display info for marketplace UI (prices in ETH)
    /// @return Array of all listed assets with complete information
    function fetchAllAssetsWithDisplayInfo() public view returns (AssetDisplayInfo[] memory) {
        uint256 itemCount = _tokenIds;
        uint256 currentIndex = 0;

        AssetDisplayInfo[] memory items = new AssetDisplayInfo[](itemCount);
        for (uint256 i = START_TOKEN_ID; i <= itemCount; i++) {
            if (realEstateAssets[i].seller != ZERO_ADDRESS) {
                items[currentIndex] = getAssetDisplayInfo(i);
                currentIndex++;
            }
        }

        // Resize array
        assembly {
            mstore(items, currentIndex)
        }

        return items;
    }

    /// @notice Get all verified and unsold assets for marketplace display (prices in ETH)
    /// @return Array of available assets with complete information
    function fetchAvailableAssets() public view returns (AssetDisplayInfo[] memory) {
        uint256 itemCount = _tokenIds;
        uint256 availableCount = 0;

        // Count available assets
        for (uint256 i = START_TOKEN_ID; i <= itemCount; i++) {
            RealEstateAsset memory asset = realEstateAssets[i];
            if (asset.seller != ZERO_ADDRESS && !asset.sold && asset.verified) {
                availableCount++;
            }
        }

        AssetDisplayInfo[] memory items = new AssetDisplayInfo[](availableCount);
        uint256 currentIndex = 0;

        for (uint256 i = START_TOKEN_ID; i <= itemCount; i++) {
            RealEstateAsset memory asset = realEstateAssets[i];
            if (asset.seller != ZERO_ADDRESS && !asset.sold && asset.verified) {
                items[currentIndex] = getAssetDisplayInfo(i);
                currentIndex++;
            }
        }

        return items;
    }

    /// @notice Get all fractionalized assets (prices in ETH)
    /// @return Array of fractionalized assets with complete information
    function fetchFractionalizedAssets() public view returns (AssetDisplayInfo[] memory) {
        uint256 itemCount = _tokenIds;
        uint256 fractionalCount = 0;

        // Count fractionalized assets
        for (uint256 i = START_TOKEN_ID; i <= itemCount; i++) {
            if (fractionalAssets[i].seller != ZERO_ADDRESS) {
                fractionalCount++;
            }
        }

        AssetDisplayInfo[] memory items = new AssetDisplayInfo[](fractionalCount);
        uint256 currentIndex = 0;

        for (uint256 i = START_TOKEN_ID; i <= itemCount; i++) {
            if (fractionalAssets[i].seller != ZERO_ADDRESS) {
                items[currentIndex] = getAssetDisplayInfo(i);
                currentIndex++;
            }
        }

        return items;
    }

    /// @notice Get buyer's portfolio of fractional investments (values in ETH)
    /// @param buyer The address of the buyer
    /// @return Array of portfolio items showing all fractional investments
    function getBuyerPortfolio(address buyer) public view returns (BuyerPortfolio[] memory) {
        uint256 itemCount = _tokenIds;
        uint256 portfolioCount = 0;

        // Count portfolio items
        for (uint256 i = START_TOKEN_ID; i <= itemCount; i++) {
            if (buyerFractions[buyer][i] > 0) {
                portfolioCount++;
            }
        }

        BuyerPortfolio[] memory portfolio = new BuyerPortfolio[](portfolioCount);
        uint256 currentIndex = 0;

        for (uint256 i = START_TOKEN_ID; i <= itemCount; i++) {
            uint256 tokensOwnedInWei = buyerFractions[buyer][i];
            if (tokensOwnedInWei > 0) {
                FractionalAsset memory fractional = fractionalAssets[i];
                uint256 totalTokensInWei = (realEstateAssets[i].price * TOKEN_UNIT) / fractional.pricePerToken;
                uint256 percentage = (tokensOwnedInWei * 100 * PERCENTAGE_SCALE) / totalTokensInWei;
                uint256 valueInWei = (tokensOwnedInWei * fractional.pricePerToken) / TOKEN_UNIT;

                portfolio[currentIndex] = BuyerPortfolio({
                    tokenId: i,
                    fractionalTokensOwned: tokenWeiToEth(tokensOwnedInWei),
                    ownershipPercentage: percentage,
                    investmentValueInEth: usdcWeiToEth(valueInWei)
                });
                currentIndex++;
            }
        }

        return portfolio;
    }

    /// @notice Get assets owned by a seller (prices in ETH)
    /// @param seller The address of the seller
    /// @return Array of assets owned by the seller
    function getSellerAssets(address seller) public view returns (AssetDisplayInfo[] memory) {
        uint256 itemCount = _tokenIds;
        uint256 sellerAssetCount = 0;

        // Count seller's assets
        for (uint256 i = START_TOKEN_ID; i <= itemCount; i++) {
            if (realEstateAssets[i].seller == seller) {
                sellerAssetCount++;
            }
        }

        AssetDisplayInfo[] memory items = new AssetDisplayInfo[](sellerAssetCount);
        uint256 currentIndex = 0;

        for (uint256 i = START_TOKEN_ID; i <= itemCount; i++) {
            if (realEstateAssets[i].seller == seller) {
                items[currentIndex] = getAssetDisplayInfo(i);
                currentIndex++;
            }
        }

        return items;
    }

    // ============================================
    // SHARE TRANSFER AND TRADING FUNCTIONS
    // ============================================

    /// @notice Transfer fractional shares to another address (off-platform sale)
    /// @param tokenId The asset token ID
    /// @param to The recipient address
    /// @param numSharesInEth Number of shares to transfer (in ETH, will be converted to wei)
    function transferShares(uint256 tokenId, address to, uint256 numSharesInEth) public nonReentrant {
        if (to == ZERO_ADDRESS) revert InvalidRecipient();
        if (to == msg.sender) revert InvalidRecipient();
        if (numSharesInEth == ZERO_AMOUNT) revert InvalidAmount();
        if (fractionalAssets[tokenId].seller == ZERO_ADDRESS) revert FractionalAssetDoesNotExist();

        uint256 numSharesInWei = tokenEthToWei(numSharesInEth);
        if (buyerFractions[msg.sender][tokenId] < numSharesInWei) revert NotEnoughTokensOwned();

        // Update sender's balance
        buyerFractions[msg.sender][tokenId] -= numSharesInWei;

        // Update recipient's balance
        bool isNewBuyer = buyerFractions[to][tokenId] == 0;
        buyerFractions[to][tokenId] += numSharesInWei;

        // Add recipient to buyers list if new
        if (isNewBuyer) {
            fractionalAssetBuyers[tokenId].push(to);
        }

        // Transfer the fractional tokens
        realEstateToken.safeTransferFrom(msg.sender, to, numSharesInWei);

        emit SharesTransferred(tokenId, msg.sender, to, numSharesInEth);
    }

    /// @notice List fractional shares for sale on the platform
    /// @param tokenId The asset token ID
    /// @param numSharesInEth Number of shares to list (in ETH, will be converted to wei)
    /// @param pricePerShareInEth Price per share in ETH (will be converted to wei internally)
    function listSharesForSale(uint256 tokenId, uint256 numSharesInEth, uint256 pricePerShareInEth) public nonReentrant {
        if (numSharesInEth == ZERO_AMOUNT) revert InvalidAmount();
        if (pricePerShareInEth == ZERO_AMOUNT) revert InvalidPrice();
        if (fractionalAssets[tokenId].seller == ZERO_ADDRESS) revert FractionalAssetDoesNotExist();

        uint256 numSharesInWei = tokenEthToWei(numSharesInEth);
        uint256 pricePerShareInWei = usdcEthToWei(pricePerShareInEth);

        if (buyerFractions[msg.sender][tokenId] < numSharesInWei) revert NotEnoughTokensOwned();

        // Transfer shares to contract for escrow
        realEstateToken.safeTransferFrom(msg.sender, address(this), numSharesInWei);

        // Create listing
        _shareListingIds++;
        uint256 newListingId = _shareListingIds;

        shareListings[newListingId] = ShareListing({
            listingId: newListingId,
            tokenId: tokenId,
            seller: msg.sender,
            numShares: numSharesInWei, // Store in wei
            pricePerShare: pricePerShareInWei, // Store in wei
            active: true
        });

        assetShareListings[tokenId].push(newListingId);

        emit SharesListed(newListingId, tokenId, msg.sender, numSharesInEth, pricePerShareInEth);
    }

    /// @notice Buy listed shares from another user
    /// @param listingId The ID of the share listing
    function buyListedShares(uint256 listingId) public nonReentrant {
        ShareListing storage listing = shareListings[listingId];
        
        if (listing.listingId == 0) revert ShareListingNotFound();
        if (!listing.active) revert ShareListingNotActive();
        if (listing.seller == msg.sender) revert CannotBuyOwnShares();

        uint256 totalPriceInWei = (listing.numShares * listing.pricePerShare) / TOKEN_UNIT;
        uint256 tradingFee = (totalPriceInWei * SHARE_TRADING_FEE_PERCENTAGE) / PERCENTAGE_DENOMINATOR;
        uint256 sellerPayment = totalPriceInWei - tradingFee;

        // Transfer USDC from buyer (full wei amount)
        usdcToken.safeTransferFrom(msg.sender, address(this), totalPriceInWei);

        // Pay seller and platform fee
        usdcToken.safeTransfer(listing.seller, sellerPayment);
        usdcToken.safeTransfer(owner(), tradingFee);

        // Update buyer fractions (remove from seller, add to buyer)
        buyerFractions[listing.seller][listing.tokenId] -= listing.numShares;
        
        bool isNewBuyer = buyerFractions[msg.sender][listing.tokenId] == 0;
        buyerFractions[msg.sender][listing.tokenId] += listing.numShares;

        // Add buyer to list if new
        if (isNewBuyer) {
            fractionalAssetBuyers[listing.tokenId].push(msg.sender);
        }

        // Transfer shares from escrow to buyer
        realEstateToken.safeTransfer(msg.sender, listing.numShares);

        // Deactivate listing
        listing.active = false;

        emit SharesPurchased(listingId, listing.tokenId, msg.sender, listing.seller, tokenWeiToEth(listing.numShares), usdcWeiToEth(totalPriceInWei));
    }

    /// @notice Cancel a share listing
    /// @param listingId The ID of the share listing
    function cancelShareListing(uint256 listingId) public nonReentrant {
        ShareListing storage listing = shareListings[listingId];
        
        if (listing.listingId == 0) revert ShareListingNotFound();
        if (listing.seller != msg.sender) revert NotShareSeller();
        if (!listing.active) revert ShareListingNotActive();

        // Return shares from escrow to seller
        realEstateToken.safeTransfer(listing.seller, listing.numShares);

        // Deactivate listing
        listing.active = false;

        emit ShareListingCanceled(listingId, listing.tokenId, msg.sender);
    }

    // ============================================
    // EXISTING FUNCTIONS (MODIFIED FOR ETH)
    // ============================================

    function registerSeller() public {
        if (sellers[msg.sender]) revert SellerAlreadyRegistered();
        sellers[msg.sender] = true;
        emit SellerRegistered(msg.sender);
    }

    function addAdmin(address _admin) onlyOwner external {
        if (isAdmin[_admin]) revert AdminAlreadyExists();
        isAdmin[_admin] = true;
    }

    function removeAdmin(address _admin) onlyOwner external {
        if (!isAdmin[_admin]) revert AdminDoesNotExist();
        isAdmin[_admin] = false;
    }

    /// @notice Create an asset listing
    /// @param _tokenURI The metadata URI for the asset
    /// @param _priceInEth Price in ETH (will be converted to USDC wei internally)
    function createAsset(string memory _tokenURI, uint256 _priceInEth) public {
        if (!sellers[msg.sender]) revert SellerNotRegistered();
        if (_priceInEth == ZERO_AMOUNT) revert InvalidPrice();

        uint256 priceInWei = usdcEthToWei(_priceInEth);

        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        _mint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, _tokenURI);
        approve(address(this), newTokenId);

        realEstateAssets[newTokenId] = RealEstateAsset(
            newTokenId,
            priceInWei, // Store in USDC wei
            payable(msg.sender),
            false,
            false
        );

        emit AssetCreated(newTokenId, _priceInEth, msg.sender, false);
    }

    function verifyAsset(uint256 tokenId) public onlyAdmin {
        if (realEstateAssets[tokenId].seller == ZERO_ADDRESS) revert AssetDoesNotExist();
        if (realEstateAssets[tokenId].verified) revert AssetAlreadyVerified();

        realEstateAssets[tokenId].verified = true;
        emit AssetVerified(tokenId, realEstateAssets[tokenId].seller);
    }

    function delistAssetAdmin(uint256 tokenId) external onlyAdmin nonReentrant {
        _delistAsset(tokenId);
    }

    function delistAsset(uint256 tokenId) external nonReentrant {
        RealEstateAsset storage asset = realEstateAssets[tokenId];
        if (asset.seller != msg.sender) revert SellerNotOwner();
        _delistAsset(tokenId);
    }

    function _delistAsset(uint256 tokenId) internal {
        RealEstateAsset storage asset = realEstateAssets[tokenId];
        if (asset.seller == ZERO_ADDRESS) revert AssetDoesNotExist();
        if (asset.sold) revert AssetAlreadySold();
        if (fractionalAssets[tokenId].totalTokens > ZERO_AMOUNT || fractionalAssetBuyers[tokenId].length > ZERO_AMOUNT)
            revert FractionalizedAssetWithBuyers();

        if (assetPaidFor[tokenId]) {
            address payable buyer = assetBuyers[tokenId];
            uint256 refundAmount = asset.price;

            assetPaidFor[tokenId] = false;
            assetBuyers[tokenId] = payable(ZERO_ADDRESS);
            assetCanceled[tokenId] = true;
            sellerCanceledPurchases[asset.seller]++;
            usdcToken.safeTransfer(buyer, refundAmount);
        }

        if (getApproved(tokenId) == address(this)) {
            _approve(ZERO_ADDRESS, tokenId);
        }

        address seller = asset.seller;
        delete realEstateAssets[tokenId];

        emit AssetDelisted(tokenId, seller);
    }

    /// @notice Create fractional asset
    /// @param tokenId The asset token ID
    /// @param totalTokensInEth Total tokens to create in ETH (will be converted to token wei internally)
    function createFractionalAsset(uint256 tokenId, uint256 totalTokensInEth) public onlyAdmin {
        RealEstateAsset storage asset = realEstateAssets[tokenId];
        if (asset.seller == ZERO_ADDRESS) revert AssetDoesNotExist();
        if (asset.sold) revert AssetAlreadySold();
        if (!asset.verified) revert AssetNotVerified();
        if (ownerOf(tokenId) != asset.seller) revert SellerNotOwner();
        if (!(getApproved(tokenId) == address(this) || isApprovedForAll(asset.seller, address(this))))
            revert ContractNotApproved();

        uint256 totalTokensInWei = tokenEthToWei(totalTokensInEth);
        uint256 pricePerTokenInWei = (asset.price * TOKEN_UNIT) / totalTokensInWei;
        
        fractionalAssets[tokenId] = FractionalAsset(tokenId, totalTokensInWei, pricePerTokenInWei, asset.seller);

        realEstateToken.mint(address(this), totalTokensInWei);

        emit FractionalAssetCreated(tokenId, totalTokensInEth, usdcWeiToEth(pricePerTokenInWei), asset.seller);
    }

    /// @notice Buy fractional asset
    /// @param tokenId The asset token ID
    /// @param numTokensInEth Number of tokens to buy in ETH (will be converted to token wei internally)
    function buyFractionalAsset(uint256 tokenId, uint256 numTokensInEth) public nonReentrant {
        FractionalAsset storage fractionalAsset = fractionalAssets[tokenId];
        if (numTokensInEth == ZERO_AMOUNT) revert InvalidAmount();

        uint256 numTokensInWei = tokenEthToWei(numTokensInEth);
        if (fractionalAsset.totalTokens < numTokensInWei) revert InsufficientTokens();

        uint256 totalPriceInWei = (numTokensInWei * fractionalAsset.pricePerToken) / TOKEN_UNIT;
        usdcToken.safeTransferFrom(msg.sender, address(this), totalPriceInWei);

        fractionalPayments[tokenId] += totalPriceInWei;
        fractionalAsset.totalTokens -= numTokensInWei;
        buyerFractions[msg.sender][tokenId] += numTokensInWei;

        realEstateToken.safeTransfer(msg.sender, numTokensInWei);

        if (buyerFractions[msg.sender][tokenId] == numTokensInWei) {
            fractionalAssetBuyers[tokenId].push(msg.sender);
        }

        uint256 totalTokensInWei = (realEstateAssets[tokenId].price * TOKEN_UNIT) / fractionalAsset.pricePerToken;
        if (
            fractionalAsset.totalTokens == ZERO_AMOUNT &&
            buyerFractions[msg.sender][tokenId] == totalTokensInWei
        ) {
            realEstateAssets[tokenId].sold = true;
            _transfer(realEstateAssets[tokenId].seller, msg.sender, tokenId);
        }

        emit FractionalAssetPurchased(tokenId, msg.sender, numTokensInEth, usdcWeiToEth(totalPriceInWei));
    }

    /// @notice Cancel fractional asset purchase
    /// @param tokenId The asset token ID
    /// @param numTokensInEth Number of tokens to cancel in ETH (will be converted to token wei internally)
    function cancelFractionalAssetPurchase(uint256 tokenId, uint256 numTokensInEth) public nonReentrant {
        if(buyerCanWithdraw[tokenId] == false) revert CannotWithdrawYet();
        if (buyerFractions[msg.sender][tokenId] == ZERO_AMOUNT) revert NoTokensOwned();

        uint256 numTokensInWei = tokenEthToWei(numTokensInEth);
        if (buyerFractions[msg.sender][tokenId] < numTokensInWei) revert NotEnoughTokensOwned();

        FractionalAsset storage fractionalAsset = fractionalAssets[tokenId];
        uint256 refundAmountInWei = (numTokensInWei * fractionalAsset.pricePerToken) / TOKEN_UNIT;

        fractionalAsset.totalTokens += numTokensInWei;
        buyerFractions[msg.sender][tokenId] -= numTokensInWei;
        fractionalPayments[tokenId] -= refundAmountInWei;

        realEstateToken.safeTransferFrom(msg.sender, address(this), numTokensInWei);

        usdcToken.safeTransfer(msg.sender, refundAmountInWei);

        emit AssetCanceled(tokenId, msg.sender);
    }

    /// @notice Distribute dividends to fractional asset holders
    /// @param tokenId The asset token ID
    /// @param amountInEth Amount to distribute in ETH (will be converted to USDC wei internally)
    function distributeFractionalDividends(uint256 tokenId, uint256 amountInEth) public onlyAdmin nonReentrant {
        if (fractionalAssets[tokenId].seller == ZERO_ADDRESS) revert FractionalAssetDoesNotExist();
        if (amountInEth == ZERO_AMOUNT) revert InvalidAmount();

        uint256 amountInWei = usdcEthToWei(amountInEth);
        if (usdcToken.balanceOf(address(this)) < amountInWei) revert InsufficientUSDCBalance();

        uint256 totalTokensInWei = realEstateAssets[tokenId].sold
            ? ((realEstateAssets[tokenId].price * TOKEN_UNIT) / fractionalAssets[tokenId].pricePerToken)
            : (fractionalAssets[tokenId].totalTokens +
                (fractionalAssetBuyers[tokenId].length > ZERO_AMOUNT
                    ? buyerFractions[fractionalAssetBuyers[tokenId][0]][tokenId]
                    : ZERO_AMOUNT));
        if (totalTokensInWei == ZERO_AMOUNT) revert NoTokensIssued();

        address[] memory buyers = new address[](fractionalAssetBuyers[tokenId].length);
        uint256[] memory amounts = new uint256[](fractionalAssetBuyers[tokenId].length);
        uint256 distributedAmount = ZERO_AMOUNT;

        for (uint256 i = 0; i < fractionalAssetBuyers[tokenId].length; i++) {
            address buyer = fractionalAssetBuyers[tokenId][i];
            uint256 numTokensInWei = buyerFractions[buyer][tokenId];
            if (numTokensInWei > ZERO_AMOUNT) {
                uint256 buyerShareInWei = (amountInWei * numTokensInWei) / totalTokensInWei;
                buyers[i] = buyer;
                amounts[i] = usdcWeiToEth(buyerShareInWei); // Convert to ETH for event
                distributedAmount += buyerShareInWei;
                usdcToken.safeTransfer(buyer, buyerShareInWei);
            }
        }

        if (distributedAmount < amountInWei) {
            usdcToken.safeTransfer(address(this), amountInWei - distributedAmount);
        }

        emit FractionalDividendsDistributed(tokenId, amountInEth, buyers, amounts);
    }

    /// @notice Withdraw USDC from contract
    /// @param recipient Recipient address
    /// @param amountInEth Amount in ETH (will be converted to USDC wei internally)
    function withdrawUSDC(address recipient, uint256 amountInEth) public onlyOwner nonReentrant {
        if (recipient == ZERO_ADDRESS) revert InvalidRecipient();
        if (amountInEth == ZERO_AMOUNT) revert InvalidAmount();

        uint256 amountInWei = usdcEthToWei(amountInEth);
        if (usdcToken.balanceOf(address(this)) < amountInWei) revert InsufficientUSDCBalance();

        usdcToken.safeTransfer(recipient, amountInWei);
        emit USDCWithdrawn(recipient, amountInEth);
    }

    function fetchFractionalAssetBuyers(uint256 tokenId) public view returns (FractionalBuyer[] memory) {
        if (fractionalAssets[tokenId].seller == ZERO_ADDRESS) revert FractionalAssetDoesNotExist();

        uint256 buyerCount = fractionalAssetBuyers[tokenId].length;
        FractionalBuyer[] memory buyers = new FractionalBuyer[](buyerCount);
        uint256 totalTokensInWei = fractionalAssets[tokenId].totalTokens +
            (realEstateAssets[tokenId].sold
                ? ((realEstateAssets[tokenId].price * TOKEN_UNIT) / fractionalAssets[tokenId].pricePerToken)
                : (buyerCount > ZERO_AMOUNT ? buyerFractions[fractionalAssetBuyers[tokenId][0]][tokenId] : ZERO_AMOUNT));

        for (uint256 i = 0; i < buyerCount; i++) {
            address buyerAddress = fractionalAssetBuyers[tokenId][i];
            uint256 numTokensInWei = buyerFractions[buyerAddress][tokenId];
            uint256 percentage = totalTokensInWei > ZERO_AMOUNT ? (numTokensInWei * 100 * PERCENTAGE_SCALE) / totalTokensInWei : ZERO_AMOUNT;

            buyers[i] = FractionalBuyer(buyerAddress, tokenWeiToEth(numTokensInWei), percentage);
        }

        return buyers;
    }

    function buyAsset(uint256 tokenId) public {
        RealEstateAsset storage asset = realEstateAssets[tokenId];
        if (asset.sold) revert AssetAlreadySold();
        if (asset.seller == msg.sender) revert NotBuyer();
        if (assetPaidFor[tokenId]) revert AssetAlreadyPaid();
        if (!asset.verified) revert AssetNotVerified();
        if (ownerOf(tokenId) != asset.seller) revert SellerNotOwner();
        if (!(getApproved(tokenId) == address(this) || isApprovedForAll(asset.seller, address(this))))
            revert ContractNotApproved();

        usdcToken.safeTransferFrom(msg.sender, address(this), asset.price);

        assetPaidFor[tokenId] = true;
        assetBuyers[tokenId] = payable(msg.sender);
        emit AssetPurchased(tokenId, msg.sender, usdcWeiToEth(asset.price));
    }

    function confirmAssetPayment(uint256 tokenId) public nonReentrant {
        if (assetBuyers[tokenId] != msg.sender) revert NotBuyer();
        RealEstateAsset storage asset = realEstateAssets[tokenId];
        if (!assetPaidFor[tokenId]) revert AssetNotPaid();
        if (asset.sold) revert AssetAlreadySold();
        if (!asset.verified) revert AssetNotVerified();
        if (ownerOf(tokenId) != asset.seller) revert SellerNotOwner();
        if (!(getApproved(tokenId) == address(this) || isApprovedForAll(asset.seller, address(this))))
            revert ContractNotApproved();

        uint256 listingFee = (asset.price * LISTING_FEE_PERCENTAGE) / PERCENTAGE_DENOMINATOR;
        uint256 paymentToSeller = asset.price - listingFee;

        asset.sold = true;
        sellerConfirmedPurchases[asset.seller]++;
        usdcToken.safeTransfer(asset.seller, paymentToSeller);
        usdcToken.safeTransfer(owner(), listingFee);

        _transfer(asset.seller, msg.sender, tokenId);

        emit AssetPaymentConfirmed(tokenId, msg.sender);
    }

    function cancelAssetPurchase(uint256 tokenId) public nonReentrant {
        if (assetBuyers[tokenId] != msg.sender) revert NotBuyer();
        RealEstateAsset storage asset = realEstateAssets[tokenId];
        if (!assetPaidFor[tokenId]) revert AssetNotPaid();
        if (asset.sold) revert AssetAlreadySold();

        uint256 cancellationPenalty = (asset.price * CANCELLATION_PENALTY_PERCENTAGE) / PERCENTAGE_DENOMINATOR;
        uint256 refundToBuyer = asset.price - cancellationPenalty;

        assetPaidFor[tokenId] = false;
        assetCanceled[tokenId] = true;
        sellerCanceledPurchases[asset.seller]++;
        usdcToken.safeTransfer(msg.sender, refundToBuyer);
        usdcToken.safeTransfer(owner(), cancellationPenalty);

        emit AssetCanceled(tokenId, msg.sender);
    }

    /// @notice Fetch asset details (prices returned in ETH for display)
    function fetchAsset(uint256 tokenId) public view returns (RealEstateAsset memory) {
        RealEstateAsset memory asset = realEstateAssets[tokenId];
        asset.price = usdcWeiToEth(asset.price); // Convert to ETH for display
        return asset;
    }

    /// @notice Fetch all listed assets (prices in ETH)
    function fetchAllListedAssets() public view returns (RealEstateAsset[] memory) {
        uint256 itemCount = _tokenIds;
        uint256 currentIndex = ZERO_AMOUNT;

        RealEstateAsset[] memory items = new RealEstateAsset[](itemCount);
        for (uint256 i = START_TOKEN_ID; i <= itemCount; i++) {
            RealEstateAsset storage currentItem = realEstateAssets[i];
            if (currentItem.seller != ZERO_ADDRESS) {
                items[currentIndex] = currentItem;
                items[currentIndex].price = usdcWeiToEth(currentItem.price); // Convert to ETH
                currentIndex++;
            }
        }

        assembly {
            mstore(items, currentIndex)
        }

        return items;
    }

    /// @notice Fetch unsold assets (prices in ETH)
    function fetchUnsoldAssets() public view returns (RealEstateAsset[] memory) {
        uint256 itemCount = _tokenIds;
        uint256 unsoldItemCount = ZERO_AMOUNT;

        for (uint256 i = START_TOKEN_ID; i <= itemCount; i++) {
            if (!realEstateAssets[i].sold && realEstateAssets[i].seller != ZERO_ADDRESS) {
                unsoldItemCount++;
            }
        }

        RealEstateAsset[] memory items = new RealEstateAsset[](unsoldItemCount);
        uint256 currentIndex = ZERO_AMOUNT;

        for (uint256 i = START_TOKEN_ID; i <= itemCount; i++) {
            if (!realEstateAssets[i].sold && realEstateAssets[i].seller != ZERO_ADDRESS) {
                items[currentIndex] = realEstateAssets[i];
                items[currentIndex].price = usdcWeiToEth(realEstateAssets[i].price); // Convert to ETH
                currentIndex++;
            }
        }

        return items;
    }

    function setBuyerCanWithdraw(uint256 tokenId, bool canWithdraw) public onlyAdmin {
        buyerCanWithdraw[tokenId] = canWithdraw;
    }
}