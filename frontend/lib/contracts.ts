// PropVera Smart Contract ABIs and addresses
// These will be imported from ../smart-contract when available

export const PROPVERA_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_PROPVERA_ADDRESS || "";

export const PROPVERA_ABI = [
  // Core functions from the PropVera contract
  // This will be replaced with actual ABI from smart-contract folder
  {
    type: "function",
    name: "createAsset",
    inputs: [
      { name: "assetType", type: "string" },
      { name: "totalShares", type: "uint256" },
      { name: "pricePerShare", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "buyShares",
    inputs: [
      { name: "assetId", type: "uint256" },
      { name: "numberOfShares", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "getAssetDetails",
    inputs: [{ name: "assetId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "assetType", type: "string" },
          { name: "totalShares", type: "uint256" },
          { name: "availableShares", type: "uint256" },
          { name: "pricePerShare", type: "uint256" },
          { name: "totalValue", type: "uint256" },
          { name: "seller", type: "address" },
        ],
      },
    ],
    stateMutability: "view",
  },
] as const;

export const STAKING_ABI = [
  {
    type: "function",
    name: "stake",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "unstake",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "claimRewards",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;
