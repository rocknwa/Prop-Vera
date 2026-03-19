// PropVera Contract ABI - Complete interface for all contract functions
export const PROPVERA_ABI = [
  // Events
  {
    type: "event",
    name: "AssetCreated",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "seller", type: "address", indexed: true },
      { name: "priceInEth", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "AssetSold",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "buyer", type: "address", indexed: true },
    ],
  },
  {
    type: "event",
    name: "FractionalAssetCreated",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "totalFractionalTokens", type: "uint256", indexed: false },
    ],
  },
  
  // Owner & Admin Functions
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isAdmin",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "addAdmin",
    inputs: [{ name: "account", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "removeAdmin",
    inputs: [{ name: "account", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdrawUSDC",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },

  // Seller Functions
  {
    type: "function",
    name: "registerSeller",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "sellers",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getSellerAssets",
    inputs: [{ name: "seller", type: "address" }],
    outputs: [
      {
        type: "tuple[]",
        components: [
          { name: "tokenId", type: "uint256" },
          { name: "seller", type: "address" },
          { name: "priceInEth", type: "uint256" },
          { name: "tokenURI", type: "string" },
          { name: "isVerified", type: "bool" },
          { name: "isSold", type: "bool" },
          { name: "isPaidFor", type: "bool" },
          { name: "currentBuyer", type: "address" },
          { name: "isFractionalized", type: "bool" },
          { name: "totalFractionalTokens", type: "uint256" },
          { name: "remainingFractionalTokens", type: "uint256" },
          { name: "fractionalTokenPrice", type: "uint256" },
          { name: "isCanceled", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getSellerMetrics",
    inputs: [{ name: "seller", type: "address" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "confirmedSales", type: "uint256" },
          { name: "canceledSales", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "createAsset",
    inputs: [
      { name: "tokenURI", type: "string" },
      { name: "priceInEth", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "delistAsset",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "delistAssetAdmin",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },

  // Buyer Functions
  {
    type: "function",
    name: "buyAsset",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "confirmAssetPayment",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "cancelAssetPurchase",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getBuyerPortfolio",
    inputs: [{ name: "buyer", type: "address" }],
    outputs: [
      {
        type: "tuple[]",
        components: [
          { name: "tokenId", type: "uint256" },
          { name: "fractionalTokensOwned", type: "uint256" },
          { name: "ownershipPercentage", type: "uint256" },
          { name: "investmentValueInEth", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },

  // Asset Listing Functions
  {
    type: "function",
    name: "fetchAvailableAssets",
    inputs: [],
    outputs: [
      {
        type: "tuple[]",
        components: [
          { name: "tokenId", type: "uint256" },
          { name: "seller", type: "address" },
          { name: "priceInEth", type: "uint256" },
          { name: "tokenURI", type: "string" },
          { name: "isVerified", type: "bool" },
          { name: "isSold", type: "bool" },
          { name: "isPaidFor", type: "bool" },
          { name: "currentBuyer", type: "address" },
          { name: "isFractionalized", type: "bool" },
          { name: "totalFractionalTokens", type: "uint256" },
          { name: "remainingFractionalTokens", type: "uint256" },
          { name: "fractionalTokenPrice", type: "uint256" },
          { name: "isCanceled", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "fetchFractionalizedAssets",
    inputs: [],
    outputs: [
      {
        type: "tuple[]",
        components: [
          { name: "tokenId", type: "uint256" },
          { name: "seller", type: "address" },
          { name: "priceInEth", type: "uint256" },
          { name: "tokenURI", type: "string" },
          { name: "isVerified", type: "bool" },
          { name: "isSold", type: "bool" },
          { name: "isPaidFor", type: "bool" },
          { name: "currentBuyer", type: "address" },
          { name: "isFractionalized", type: "bool" },
          { name: "totalFractionalTokens", type: "uint256" },
          { name: "remainingFractionalTokens", type: "uint256" },
          { name: "fractionalTokenPrice", type: "uint256" },
          { name: "isCanceled", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAssetDisplayInfo",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "tokenId", type: "uint256" },
          { name: "seller", type: "address" },
          { name: "priceInEth", type: "uint256" },
          { name: "tokenURI", type: "string" },
          { name: "isVerified", type: "bool" },
          { name: "isSold", type: "bool" },
          { name: "isPaidFor", type: "bool" },
          { name: "currentBuyer", type: "address" },
          { name: "isFractionalized", type: "bool" },
          { name: "totalFractionalTokens", type: "uint256" },
          { name: "remainingFractionalTokens", type: "uint256" },
          { name: "fractionalTokenPrice", type: "uint256" },
          { name: "isCanceled", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },

  // Fractional & Share Functions
  {
    type: "function",
    name: "createFractionalAsset",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "totalFractionalTokens", type: "uint256" },
      { name: "pricePerToken", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "buyFractionalTokens",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "numberOfTokens", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "transferShares",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "recipient", type: "address" },
      { name: "numberOfTokens", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "listSharesForSale",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "numberOfTokens", type: "uint256" },
      { name: "pricePerShare", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "cancelShareListing",
    inputs: [{ name: "listingId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "buyListedShares",
    inputs: [{ name: "listingId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getAllActiveShareListings",
    inputs: [],
    outputs: [
      {
        type: "tuple[]",
        components: [
          { name: "listingId", type: "uint256" },
          { name: "tokenId", type: "uint256" },
          { name: "seller", type: "address" },
          { name: "numberOfTokens", type: "uint256" },
          { name: "pricePerShare", type: "uint256" },
          { name: "isActive", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },

  // Admin Asset Management
  {
    type: "function",
    name: "verifyAsset",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "distributeFractionalDividends",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "amountInUsdc", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setBuyerCanWithdraw",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "canWithdraw", type: "bool" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "buyerCanWithdraw",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "cancelFractionalAssetPurchase",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "numberOfTokens", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;
