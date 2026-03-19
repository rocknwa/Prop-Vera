// MockUSDC ABI — 6 decimal ERC-20 with minter whitelist
// mint(address, uint256) takes whole USDC units — contract multiplies by 1e6 internally

export const MOCKUSDC_ABI = [
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
    stateMutability: "pure",
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

  // ── Minter whitelist ──────────────────────────────────────────────────────

  {
    name: "isMinter",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "setMinter",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "account", type: "address" },
      { name: "enabled", type: "bool" },
    ],
    outputs: [],
  },

  // ── Mint ──────────────────────────────────────────────────────────────────

  {
    // amountInEth: whole USDC units e.g. 10000 = 10,000 USDC
    // Contract multiplies by 1e6 internally — do NOT pre-multiply in frontend
    name: "mint",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amountInEth", type: "uint256" },
    ],
    outputs: [],
  },
  {
    // mintWei: exact base-unit amount (already in 6-decimal wei)
    name: "mintWei",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amountInWei", type: "uint256" },
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
  {
    name: "MinterSet",
    type: "event",
    inputs: [
      { name: "account", type: "address", indexed: true },
      { name: "enabled", type: "bool", indexed: false },
    ],
  },

  // ── Custom errors ─────────────────────────────────────────────────────────

  { name: "NotMinter", type: "error", inputs: [] },
  { name: "ZeroAddress", type: "error", inputs: [] },
] as const;
