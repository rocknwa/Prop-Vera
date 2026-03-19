// Auto-generated from PropVera.sol + modules — complete ABI
// Covers: AssetMarketplace, Fractionalization, ShareTrading, PropVera core
// Public state variable getters + all external functions + events + errors

export const PROPVERA_ABI = [
  // ── Public state variable getters ─────────────────────────────────────────

  {
    name: "realEstateToken",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "usdcToken",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "sellers",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "isAdmin",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "buyerCanWithdraw",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "realEstateAssets",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "tokenId", type: "uint256" },
      { name: "price", type: "uint256" },
      { name: "seller", type: "address" },
      { name: "sold", type: "bool" },
      { name: "verified", type: "bool" },
    ],
  },
  {
    name: "fractionalAssets",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "tokenId", type: "uint256" },
      { name: "totalTokens", type: "uint256" },
      { name: "pricePerToken", type: "uint256" },
      { name: "seller", type: "address" },
    ],
  },
  {
    name: "shareListings",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "listingId", type: "uint256" },
      { name: "tokenId", type: "uint256" },
      { name: "seller", type: "address" },
      { name: "active", type: "bool" },
      { name: "numShares", type: "uint256" },
      { name: "pricePerShare", type: "uint256" },
    ],
  },

  // ── Ownable ───────────────────────────────────────────────────────────────

  {
    name: "owner",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "transferOwnership",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "newOwner", type: "address" }],
    outputs: [],
  },
  {
    name: "renounceOwnership",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },

  // ── ERC-721 standard ──────────────────────────────────────────────────────

  {
    name: "name",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    name: "tokenURI",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
  {
    name: "ownerOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getApproved",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "isApprovedForAll",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "operator", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "setApprovalForAll",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "operator", type: "address" },
      { name: "approved", type: "bool" },
    ],
    outputs: [],
  },
  {
    name: "transferFrom",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "safeTransferFrom",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "supportsInterface",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "interfaceId", type: "bytes4" }],
    outputs: [{ name: "", type: "bool" }],
  },

  // ── Admin management ──────────────────────────────────────────────────────

  {
    name: "addAdmin",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "_admin", type: "address" }],
    outputs: [],
  },
  {
    name: "removeAdmin",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "_admin", type: "address" }],
    outputs: [],
  },

  // ── Treasury ──────────────────────────────────────────────────────────────

  {
    name: "withdrawUSDC",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "amountInEth", type: "uint256" },
    ],
    outputs: [],
  },

  // ── Seller registration ───────────────────────────────────────────────────

  {
    name: "registerSeller",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },

  // ── Asset lifecycle ───────────────────────────────────────────────────────

  {
    name: "createAsset",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_tokenURI", type: "string" },
      { name: "_priceInEth", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "verifyAsset",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "delistAsset",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "delistAssetAdmin",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [],
  },

  // ── Purchase flow ─────────────────────────────────────────────────────────

  {
    name: "buyAsset",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "confirmAssetPayment",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "cancelAssetPurchase",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [],
  },

  // ── Fractionalization ─────────────────────────────────────────────────────

  {
    name: "createFractionalAsset",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "totalTokensInEth", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "buyFractionalAsset",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "numTokensInEth", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "cancelFractionalAssetPurchase",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "numTokensInEth", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "distributeFractionalDividends",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "amountInEth", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "setBuyerCanWithdraw",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "canWithdraw", type: "bool" },
    ],
    outputs: [],
  },

  // ── Share trading ─────────────────────────────────────────────────────────

  {
    name: "transferShares",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "to", type: "address" },
      { name: "numSharesInEth", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "listSharesForSale",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "numSharesInEth", type: "uint256" },
      { name: "pricePerShareInEth", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "buyListedShares",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "listingId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "cancelShareListing",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "listingId", type: "uint256" }],
    outputs: [],
  },

  // ── View: asset reads ─────────────────────────────────────────────────────

  {
    name: "fetchAsset",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "tokenId", type: "uint256" },
          { name: "price", type: "uint256" },
          { name: "seller", type: "address" },
          { name: "sold", type: "bool" },
          { name: "verified", type: "bool" },
        ],
      },
    ],
  },
  {
    name: "fetchAllListedAssets",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "tokenId", type: "uint256" },
          { name: "price", type: "uint256" },
          { name: "seller", type: "address" },
          { name: "sold", type: "bool" },
          { name: "verified", type: "bool" },
        ],
      },
    ],
  },
  {
    name: "fetchUnsoldAssets",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "tokenId", type: "uint256" },
          { name: "price", type: "uint256" },
          { name: "seller", type: "address" },
          { name: "sold", type: "bool" },
          { name: "verified", type: "bool" },
        ],
      },
    ],
  },
  {
    name: "getAssetDisplayInfo",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "tokenId", type: "uint256" },
          { name: "priceInEth", type: "uint256" },
          { name: "seller", type: "address" },
          { name: "sold", type: "bool" },
          { name: "verified", type: "bool" },
          { name: "isPaidFor", type: "bool" },
          { name: "isCanceled", type: "bool" },
          { name: "currentBuyer", type: "address" },
          { name: "tokenURI", type: "string" },
          { name: "isFractionalized", type: "bool" },
          { name: "totalFractionalTokens", type: "uint256" },
          { name: "remainingFractionalTokens", type: "uint256" },
          { name: "pricePerFractionalTokenInEth", type: "uint256" },
          { name: "accumulatedFractionalPaymentsInEth", type: "uint256" },
        ],
      },
    ],
  },
  {
    name: "fetchAllAssetsWithDisplayInfo",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "tokenId", type: "uint256" },
          { name: "priceInEth", type: "uint256" },
          { name: "seller", type: "address" },
          { name: "sold", type: "bool" },
          { name: "verified", type: "bool" },
          { name: "isPaidFor", type: "bool" },
          { name: "isCanceled", type: "bool" },
          { name: "currentBuyer", type: "address" },
          { name: "tokenURI", type: "string" },
          { name: "isFractionalized", type: "bool" },
          { name: "totalFractionalTokens", type: "uint256" },
          { name: "remainingFractionalTokens", type: "uint256" },
          { name: "pricePerFractionalTokenInEth", type: "uint256" },
          { name: "accumulatedFractionalPaymentsInEth", type: "uint256" },
        ],
      },
    ],
  },
  {
    name: "fetchAvailableAssets",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "tokenId", type: "uint256" },
          { name: "priceInEth", type: "uint256" },
          { name: "seller", type: "address" },
          { name: "sold", type: "bool" },
          { name: "verified", type: "bool" },
          { name: "isPaidFor", type: "bool" },
          { name: "isCanceled", type: "bool" },
          { name: "currentBuyer", type: "address" },
          { name: "tokenURI", type: "string" },
          { name: "isFractionalized", type: "bool" },
          { name: "totalFractionalTokens", type: "uint256" },
          { name: "remainingFractionalTokens", type: "uint256" },
          { name: "pricePerFractionalTokenInEth", type: "uint256" },
          { name: "accumulatedFractionalPaymentsInEth", type: "uint256" },
        ],
      },
    ],
  },
  {
    name: "fetchFractionalizedAssets",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "tokenId", type: "uint256" },
          { name: "priceInEth", type: "uint256" },
          { name: "seller", type: "address" },
          { name: "sold", type: "bool" },
          { name: "verified", type: "bool" },
          { name: "isPaidFor", type: "bool" },
          { name: "isCanceled", type: "bool" },
          { name: "currentBuyer", type: "address" },
          { name: "tokenURI", type: "string" },
          { name: "isFractionalized", type: "bool" },
          { name: "totalFractionalTokens", type: "uint256" },
          { name: "remainingFractionalTokens", type: "uint256" },
          { name: "pricePerFractionalTokenInEth", type: "uint256" },
          { name: "accumulatedFractionalPaymentsInEth", type: "uint256" },
        ],
      },
    ],
  },
  {
    name: "getSellerAssets",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "seller", type: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "tokenId", type: "uint256" },
          { name: "priceInEth", type: "uint256" },
          { name: "seller", type: "address" },
          { name: "sold", type: "bool" },
          { name: "verified", type: "bool" },
          { name: "isPaidFor", type: "bool" },
          { name: "isCanceled", type: "bool" },
          { name: "currentBuyer", type: "address" },
          { name: "tokenURI", type: "string" },
          { name: "isFractionalized", type: "bool" },
          { name: "totalFractionalTokens", type: "uint256" },
          { name: "remainingFractionalTokens", type: "uint256" },
          { name: "pricePerFractionalTokenInEth", type: "uint256" },
          { name: "accumulatedFractionalPaymentsInEth", type: "uint256" },
        ],
      },
    ],
  },
  {
    name: "getBuyerPortfolio",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "buyer", type: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "tokenId", type: "uint256" },
          { name: "fractionalTokensOwned", type: "uint256" },
          { name: "ownershipPercentage", type: "uint256" },
          { name: "investmentValueInEth", type: "uint256" },
        ],
      },
    ],
  },

  // ── View: purchase state ──────────────────────────────────────────────────

  {
    name: "isAssetPaidFor",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "getAssetBuyer",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "isAssetCanceled",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
  },

  // ── View: seller metrics ──────────────────────────────────────────────────

  {
    name: "getSellerMetrics",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "sellerAddress", type: "address" }],
    outputs: [
      { name: "confirmed", type: "uint256" },
      { name: "canceled", type: "uint256" },
    ],
  },

  // ── View: fractional data ─────────────────────────────────────────────────

  {
    name: "getBuyerFractions",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "buyer", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getFractionalAssetBuyersList",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address[]" }],
  },
  {
    name: "getFractionalPayments",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "fetchFractionalAssetBuyers",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "buyer", type: "address" },
          { name: "numTokens", type: "uint256" },
          { name: "percentage", type: "uint256" },
        ],
      },
    ],
  },

  // ── View: share market ────────────────────────────────────────────────────

  {
    name: "getAssetShareListings",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "listingId", type: "uint256" },
          { name: "tokenId", type: "uint256" },
          { name: "seller", type: "address" },
          { name: "active", type: "bool" },
          { name: "numShares", type: "uint256" },
          { name: "pricePerShare", type: "uint256" },
        ],
      },
    ],
  },
  {
    name: "getAllActiveShareListings",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "listingId", type: "uint256" },
          { name: "tokenId", type: "uint256" },
          { name: "seller", type: "address" },
          { name: "active", type: "bool" },
          { name: "numShares", type: "uint256" },
          { name: "pricePerShare", type: "uint256" },
        ],
      },
    ],
  },

  // ── Events ────────────────────────────────────────────────────────────────

  {
    name: "AssetCreated",
    type: "event",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "priceInEth", type: "uint256", indexed: false },
      { name: "seller", type: "address", indexed: true },
      { name: "verified", type: "bool", indexed: false },
    ],
  },
  {
    name: "AssetVerified",
    type: "event",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "seller", type: "address", indexed: true },
    ],
  },
  {
    name: "AssetDelisted",
    type: "event",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "seller", type: "address", indexed: true },
    ],
  },
  {
    name: "AssetPurchased",
    type: "event",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "buyer", type: "address", indexed: true },
      { name: "priceInEth", type: "uint256", indexed: false },
    ],
  },
  {
    name: "AssetPaymentConfirmed",
    type: "event",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "buyer", type: "address", indexed: true },
    ],
  },
  {
    name: "AssetCanceled",
    type: "event",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "buyer", type: "address", indexed: true },
    ],
  },
  {
    name: "FractionalAssetCreated",
    type: "event",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "totalTokensInEth", type: "uint256", indexed: false },
      { name: "pricePerTokenInEth", type: "uint256", indexed: false },
      { name: "seller", type: "address", indexed: true },
    ],
  },
  {
    name: "FractionalAssetPurchased",
    type: "event",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "buyer", type: "address", indexed: true },
      { name: "numTokensInEth", type: "uint256", indexed: false },
      { name: "totalPriceInEth", type: "uint256", indexed: false },
    ],
  },
  {
    name: "FractionalDividendsDistributed",
    type: "event",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "totalAmountInEth", type: "uint256", indexed: false },
      { name: "buyers", type: "address[]", indexed: false },
      { name: "amounts", type: "uint256[]", indexed: false },
    ],
  },
  {
    name: "SellerRegistered",
    type: "event",
    inputs: [{ name: "sellerAddress", type: "address", indexed: true }],
  },
  {
    name: "USDCWithdrawn",
    type: "event",
    inputs: [
      { name: "recipient", type: "address", indexed: true },
      { name: "amountInEth", type: "uint256", indexed: false },
    ],
  },
  {
    name: "SharesTransferred",
    type: "event",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "numSharesInEth", type: "uint256", indexed: false },
    ],
  },
  {
    name: "SharesListed",
    type: "event",
    inputs: [
      { name: "listingId", type: "uint256", indexed: true },
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "seller", type: "address", indexed: true },
      { name: "numSharesInEth", type: "uint256", indexed: false },
      { name: "pricePerShareInEth", type: "uint256", indexed: false },
    ],
  },
  {
    name: "SharesPurchased",
    type: "event",
    inputs: [
      { name: "listingId", type: "uint256", indexed: true },
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "buyer", type: "address", indexed: true },
      { name: "seller", type: "address", indexed: false },
      { name: "numSharesInEth", type: "uint256", indexed: false },
      { name: "totalPriceInEth", type: "uint256", indexed: false },
    ],
  },
  {
    name: "ShareListingCanceled",
    type: "event",
    inputs: [
      { name: "listingId", type: "uint256", indexed: true },
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "seller", type: "address", indexed: true },
    ],
  },

  // ── Custom errors ─────────────────────────────────────────────────────────

  { name: "NotAdmin", type: "error", inputs: [{ name: "caller", type: "address" }] },
  { name: "NotAuthorized", type: "error", inputs: [] },
  { name: "SellerAlreadyRegistered", type: "error", inputs: [] },
  { name: "SellerNotRegistered", type: "error", inputs: [] },
  { name: "SellerNotOwner", type: "error", inputs: [] },
  { name: "AdminAlreadyExists", type: "error", inputs: [] },
  { name: "AdminDoesNotExist", type: "error", inputs: [] },
  { name: "AssetDoesNotExist", type: "error", inputs: [] },
  { name: "AssetAlreadyVerified", type: "error", inputs: [] },
  { name: "AssetAlreadySold", type: "error", inputs: [] },
  { name: "AssetAlreadyPaid", type: "error", inputs: [] },
  { name: "AssetNotPaid", type: "error", inputs: [] },
  { name: "AssetNotVerified", type: "error", inputs: [] },
  { name: "FractionalizedAssetWithBuyers", type: "error", inputs: [] },
  { name: "FractionalAssetDoesNotExist", type: "error", inputs: [] },
  { name: "InvalidPrice", type: "error", inputs: [] },
  { name: "InvalidAmount", type: "error", inputs: [] },
  { name: "InvalidRecipient", type: "error", inputs: [] },
  { name: "InsufficientTokens", type: "error", inputs: [] },
  { name: "InsufficientUSDCBalance", type: "error", inputs: [] },
  { name: "NoTokensOwned", type: "error", inputs: [] },
  { name: "NoTokensIssued", type: "error", inputs: [] },
  { name: "NotEnoughTokensOwned", type: "error", inputs: [] },
  { name: "NotBuyer", type: "error", inputs: [] },
  { name: "ContractNotApproved", type: "error", inputs: [] },
  { name: "CannotWithdrawYet", type: "error", inputs: [] },
  { name: "ShareListingNotFound", type: "error", inputs: [] },
  { name: "ShareListingNotActive", type: "error", inputs: [] },
  { name: "NotShareSeller", type: "error", inputs: [] },
  { name: "CannotBuyOwnShares", type: "error", inputs: [] },
] as const;
