// PropVeraFractionalToken ABI — ERC-20 with 18 decimals
// Token symbol: PVF
// Minting restricted to owner or PropVera contract

export const FRACTIONAL_TOKEN_ABI = [
  // ── ERC-20 standard ───────────────────────────────────────────────────────

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
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    name: "totalSupply",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "transferFrom",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },

  // ── Ownable ───────────────────────────────────────────────────────────────

  {
    name: "owner",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },

  // ── PropVera-specific ─────────────────────────────────────────────────────

  {
    name: "propVera",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "propVeraLocked",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    // One-time call — permanently locks propVera address after first set
    name: "setPropVera",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "_propVera", type: "address" }],
    outputs: [],
  },

  // ── Mint ──────────────────────────────────────────────────────────────────

  {
    // amount: token wei (18 decimals) — called internally by PropVera contract
    name: "mint",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    // amountInEth: whole token units — contract converts to wei internally
    name: "mintEth",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amountInEth", type: "uint256" },
    ],
    outputs: [],
  },

  // ── Conversion helpers ────────────────────────────────────────────────────

  {
    name: "ethToWei",
    type: "function",
    stateMutability: "pure",
    inputs: [{ name: "amountInEth", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "weiToEth",
    type: "function",
    stateMutability: "pure",
    inputs: [{ name: "amountInWei", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },

  // ── Events ────────────────────────────────────────────────────────────────

  {
    name: "Transfer",
    type: "event",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
    ],
  },
  {
    name: "Approval",
    type: "event",
    inputs: [
      { name: "owner", type: "address", indexed: true },
      { name: "spender", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
    ],
  },

  // ── Custom errors ─────────────────────────────────────────────────────────

  { name: "NotAuthorized", type: "error", inputs: [] },
  { name: "PropVeraAlreadyLocked", type: "error", inputs: [] },
  { name: "ZeroAddress", type: "error", inputs: [] },
] as const;
