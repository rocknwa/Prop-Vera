# PropVera

**Democratizing Real Estate Investment on Cronos EVM**

[![License: UNLICENSED](https://img.shields.io/badge/License-UNLICENSED-red.svg)](LICENSE)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.28-blue.svg)](https://soliditylang.org/)
[![Cronos](https://img.shields.io/badge/Network-Cronos_EVM-002D74.svg)](https://cronos.org/)
[![Tests](https://img.shields.io/badge/Tests-158_Passing-brightgreen.svg)](#testing)
[![Coverage](https://img.shields.io/badge/Test_Coverage-100%25_Branch-brightgreen.svg)](#testing)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js_16-black.svg)](https://nextjs.org/)

> **Invest in real estate with any amount. Own property with on-chain proof.**

PropVera is a decentralized application (DApp) that removes traditional barriers to real estate investment by enabling fractional ownership, transparent transactions, and verifiable property rights — all powered by blockchain technology on Cronos EVM.

---

## 🏗️ Deployed Contracts

**Network**: Cronos Testnet (Chain ID: 338)

| Contract | Address | Explorer |
|----------|---------|----|
| `PropVera` | `0x445d64454aEe5dDB67413b9e8334767AFEd06f21` | [View on Cronos Explorer](https://explorer.cronos.org/testnet/address/0x445d64454aEe5dDB67413b9e8334767AFEd06f21) |
| `PropVeraFractionalToken` | `0xb7Aa8b8Be8fd0d07F5d00a94DCb7A187f69b21ff` | [View on Cronos Explorer](https://explorer.cronos.org/testnet/address/0xb7Aa8b8Be8fd0d07F5d00a94DCb7A187f69b21ff) |
| `MockUSDC` | `0x6C24c00a08e088f84b7e72588509b93133BCEd5b` | [View on Cronos Explorer](https://explorer.cronos.org/testnet/address/0x6C24c00a08e088f84b7e72588509b93133BCEd5b) |
| `USDCFaucet` | `0x10e60A87ceFF98456F69663f24483bC9b8a662B7` | [View on Cronos Explorer](https://explorer.cronos.org/testnet/address/0x10e60A87ceFF98456F69663f24483bC9b8a662B7) |

All 4 contracts are **deployed and verified** on Cronos Testnet Explorer with source code publicly readable.

---

## 🎯 The Problem

Real estate investment has historically been inaccessible to average investors due to:

- **High Capital Requirements**: Traditional property investments require tens or hundreds of thousands of dollars
- **Lack of Liquidity**: Real estate assets are notoriously difficult to buy and sell quickly
- **Opacity & Trust Issues**: Property ownership records are often fragmented, outdated, or inaccessible
- **Geographic Limitations**: Investors are typically restricted to properties in their immediate vicinity
- **Complex Intermediaries**: Multiple middlemen increase costs and slow down transactions
- **Documentation Barriers**: Claiming property documents requires physical presence and bureaucratic processes

**Result**: Millions of potential investors are locked out of one of the world's most stable asset classes.

---

## 💡 Our Solution

PropVera leverages blockchain technology on Cronos EVM to make real estate investment:

### **Accessible**
- Fractional ownership starting with **any amount** (even as low as $5)
- Invest in multiple properties to diversify your portfolio
- No geographic restrictions — invest globally from your device
- Buy properties remotely with on-chain proof of ownership

### **Transparent**
- Every transaction recorded immutably on Cronos blockchain
- Complete ownership history and verification status publicly viewable
- Smart contracts eliminate ambiguity in agreements
- Real-time portfolio tracking

### **Liquid**
- **Secondary marketplace** for peer-to-peer share trading
- Sell your fractional ownership anytime without waiting for full property sales
- Instant settlement via smart contracts
- Ultra-low gas fees on Cronos EVM

### **Secure**
- Non-custodial design — you control your assets
- Multi-admin verification system prevents fraudulent listings
- On-chain proof of ownership through NFT and fractional tokens
- **Anti-rug protection**: Fractional assets cannot be delisted once investors have purchased shares
- **Controlled withdrawals**: Capital withdrawals require admin approval, preventing abuse

### **Profitable**
- **Automated dividend distribution** to all fractional owners
- Transparent fee structure (3% listing fee, 2% trading fee)
- Real-time portfolio tracking and performance metrics
- Micro-transaction economics enable profitable small investments

### **User-Friendly**
- **Built-in USDC faucet** — click "🪙 Get USDC" in the navbar to receive 10,000 test USDC instantly, no external tools needed
- **IPFS image uploads** via Pinata — sellers upload property images directly from the UI
- **Hamburger menu** with full mobile navigation drawer — USDC balance, role badge, and all pages accessible on mobile
- Role-based navigation — Admin dashboard auto-detects on-chain role
- Two-step approve → transact flow with clear step indicators

---

## 🚀 Why Cronos?

PropVera is purpose-built for the Cronos ecosystem and Cronos Ignition:

| Cronos Advantage | PropVera Benefit |
|---|---|
| **~2s block times** | Near-instant property purchase confirmations |
| **EVM-compatible** | Full Solidity + OpenZeppelin toolchain, no rewrites needed |
| **Low gas fees** | Enables micro-transactions — buy fractional shares for as little as $5 |
| **USDC liquidity** | Native stablecoin payments eliminate crypto price volatility for real estate |
| **Growing DeFi ecosystem** | Roadmap: PVF fractional tokens as collateral in Cronos DeFi lending protocols |
| **Crypto.com reach** | Access to 80M+ Crypto.com users as potential real estate investors |

PropVera is positioned to become Cronos's flagship Real World Asset (RWA) protocol, bringing the trillion-dollar real estate market on-chain.

---

## 🏗️ How It Works

### For Investors

1. **Connect Wallet**: Use MetaMask, WalletConnect, or any EVM wallet on Cronos Testnet
2. **Get Test USDC**: Click "🪙 Get USDC" in the navbar — the `USDCFaucet` contract mints 10,000 USDC directly to your wallet
3. **Browse Verified Properties**: View listings on the marketplace or fractional page
4. **Choose Your Investment**: Buy entire properties or fractional PVF shares
5. **Instant Ownership**: Receive NFTs (whole property) or PVF tokens (fractional shares)
6. **Earn Dividends**: Receive automated USDC distributions proportional to your ownership
7. **Trade Anytime**: List your shares on the secondary marketplace or transfer peer-to-peer

### For Sellers

1. **Register**: Call `registerSeller()` once from the Seller dashboard
2. **Upload Image**: Select a property image — it's uploaded to IPFS via Pinata and pinned permanently
3. **Create Asset NFT**: Fill the property form — metadata (name, description, IPFS image URL, location, type, size) encoded as base64 JSON on-chain
4. **Await Verification**: Admin reviews and verifies your listing
5. **Receive Payment**: Get paid in USDC automatically when buyers confirm (97% to seller, 3% platform fee)

### For Admins

1. **Verify Assets**: Review and approve pending seller listings
2. **Fractionalize**: Split verified assets into PVF ERC-20 tokens with custom token count
3. **Distribute Dividends**: Push USDC proportionally to all fractional holders
4. **Manage Withdrawals**: Enable/disable fractional cancellations per asset
5. **Treasury**: Withdraw platform fees to any recipient address

### Property Flow

```
Seller → registerSeller() → uploadImage(Pinata IPFS) → createAsset(tokenURI, price)
                                                                      ↓
                                                              [Pending Verification]
                                                                      ↓
                                                          Admin → verifyAsset()
                                                                      ↓
                                                              [Available]
                                                         ↙               ↘
                                              buyAsset()         createFractionalAsset()
                                                 ↓                        ↓
                                       confirmAssetPayment()    buyFractionalAsset()
                                                 ↓                        ↓
                                           NFT Transfer         PVF Token Distribution
                                                                          ↓
                                                                Secondary Market Trading
                                                                          ↓
                                                         distributeFractionalDividends()
```

---

## 🛠️ Technology Stack

### **Smart Contracts** (`smart-contract/`)
- **Language**: Solidity ^0.8.28
- **Framework**: Hardhat v2.26.3
- **Libraries**: OpenZeppelin v5.6.1 (ERC721URIStorage, ERC20, ReentrancyGuard, SafeERC20, Ownable)
- **Network**: Cronos Testnet (Chain ID: 338)
- **Payment Token**: MockUSDC (6 decimals, minter-whitelisted)
- **Testing**: **158 tests passing, 100% branch coverage**

**Modular Architecture**:
```
smart-contract/contracts/
├── core/PropVera.sol               ← Main contract, composes all modules
├── modules/
│   ├── AssetMarketplace.sol        ← Listing, verification, purchase flow
│   ├── Fractionalization.sol       ← Fractional tokens, dividends
│   └── ShareTrading.sol            ← Secondary market, P2P transfers
├── storage/PropVeraStorage.sol     ← Shared storage layout
├── tokens/
│   ├── PropVeraFractionalToken.sol ← ERC-20 PVF token (18 dec)
│   └── MockUSDC.sol                ← Test USDC with minter whitelist (6 dec)
├── mocks/
│   └── USDCFaucet.sol              ← Public faucet, rate-limited, owner-bypass
├── types/PropVeraTypes.sol         ← Structs: RealEstateAsset, FractionalAsset…
├── errors/PropVeraErrors.sol       ← 25+ custom errors
├── events/PropVeraEvents.sol       ← All events
├── libraries/ConversionLib.sol     ← USDC ↔ Token unit conversion helpers
└── interfaces/IPropVera.sol        ← External interface
```

### **Frontend** (`frontend/`)
- **Framework**: Next.js 16.2.0 (App Router, Turbopack)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Web3**: wagmi v2 + RainbowKit v2 + viem v2
- **State**: TanStack Query v5
- **Image Storage**: Pinata IPFS (property images pinned on-chain via base64 metadata)

**Pages**:
| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/marketplace` | Browse verified available properties |
| `/fractional` | Browse fractionalized assets |
| `/share-market` | Secondary peer-to-peer share listings |
| `/asset/[id]` | Asset detail — buy whole or fractional, secondary listings |
| `/dashboard` | Buyer portfolio, pending purchases, share management |
| `/seller` | Register, upload image to IPFS, create assets, manage listings |
| `/admin` | On-chain gated: verify, fractionalize, dividends, treasury |

---

## ✨ Core Features

### 🏠 Asset Management
- Individual seller property listings with IPFS-hosted images and base64 on-chain metadata
- Multi-admin verification before assets go live
- Asset delisting with automatic buyer refunds
- Real-time status tracking: created → verified → sold

### 💰 Investment Options
- **Whole property purchases**: Buy entire properties as ERC-721 NFTs
- **Two-step flow**: Pay → Confirm to receive NFT (or cancel for 99% refund)
- **Fractional ownership**: Invest in PVF token shares with any amount
- **Secondary market**: Buy/sell shares from other investors (2% platform fee)
- **Share transfers**: Send fractional shares peer-to-peer at zero fee

### 🪙 USDC Faucet
- `USDCFaucet` contract is whitelisted as a minter on MockUSDC
- Anyone can call `drip()` to receive 10,000 test USDC
- Rate-limited with configurable cooldown (set to 0 on testnet — unlimited drips)
- Owner bypass via `ownerDrip()` for manual distributions

### 📷 IPFS Image Uploads
- Sellers upload property images directly from the create-asset form
- Images pinned to IPFS via Pinata API — permanently stored and content-addressed
- IPFS URL embedded in NFT metadata — immutable and decentralized

### 📊 Financial Features
- USDC stablecoin transactions — no crypto volatility
- Automated dividend distribution to all fractional owners
- **Transparent fees**: 3% listing · 2% trading · 1% cancellation penalty
- Portfolio dashboard with total invested, PVF balance, ownership percentages

### 🔐 Security & Verification
- Multi-admin system with separate Owner and Admin roles
- ReentrancyGuard on every financial function
- CEI (Check-Effects-Interactions) pattern throughout
- SafeERC20 wrapping all token transfers
- Anti-rug: fractional assets with investors cannot be delisted
- AML: capital withdrawals require admin-gated approval

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.x
- pnpm >= 9.x
- MetaMask or any EVM-compatible wallet

### Add Cronos Testnet to MetaMask

| Field | Value |
|-------|-------|
| Network Name | Cronos Testnet |
| RPC URL | `https://evm-t3.cronos.org/` |
| Chain ID | `338` |
| Currency Symbol | `TCRO` |
| Block Explorer | `https://explorer.cronos.org/testnet` |

### Clone & Run

```bash
git clone https://github.com/rocknwa/Prop-Vera.git
cd Prop-Vera
```

**Smart Contracts:**
```bash
cd smart-contract
npm install
npx hardhat compile
npx hardhat test          # 158 tests
npx hardhat coverage      # 100% branch coverage
npx hardhat ignition deploy ignition/modules/deploy.js --network cronosTestnet
```

**Frontend:**
```bash
cd frontend
pnpm install
cp .env.example .env.local
# Fill in your values — see .env.example for all required variables
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

```env
# Required
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Contract addresses (Cronos Testnet)
NEXT_PUBLIC_PROPVERA_ADDRESS=0x445d64454aEe5dDB67413b9e8334767AFEd06f21
NEXT_PUBLIC_FRACTIONAL_TOKEN_ADDRESS=0xb7Aa8b8Be8fd0d07F5d00a94DCb7A187f69b21ff
NEXT_PUBLIC_USDC_ADDRESS=0x6C24c00a08e088f84b7e72588509b93133BCEd5b
NEXT_PUBLIC_FAUCET_ADDRESS=0x10e60A87ceFF98456F69663f24483bC9b8a662B7

# Pinata IPFS (for property image uploads)
# Get JWT from: https://app.pinata.cloud/developers/api-keys
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt_here
NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud
```

---

## 🧪 Testing

```bash
cd smart-contract

npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat coverage
```

**Results — 158 tests, 100% branch coverage:**

```
PropVera and PropVeraFractionalToken  (109 tests)
  ├── PropVeraFractionalToken Deployment
  ├── PropVera Deployment
  ├── Seller Registration
  ├── Asset Creation
  ├── Asset Verification
  ├── Fractionalization
  ├── Fractional Purchases
  ├── Dividend Distribution
  ├── Asset Purchase
  ├── Delisting
  ├── Withdrawals
  ├── MockUSDC
  ├── Asset Purchase Cancellation
  ├── Admin Management
  ├── Asset Listing
  ├── Share Transfer and Trading
  ├── Buyer Portfolio
  ├── Display Info Functions
  ├── Fractional Asset Cancellation
  └── ... full branch coverage across all modules

USDCFaucet  (49 tests)
  ├── Deployment
  ├── drip()
  ├── dripTo()
  ├── cooldownRemaining()
  ├── canDrip()
  ├── setDripAmount()
  ├── setCooldown()
  ├── ownerDrip()
  ├── MockUSDC minter integration
  └── Edge cases
```

---

## 📈 Roadmap

### ✅ Phase 0 — Core Protocol (Complete)
- ✅ Modular smart contract architecture (4 contracts deployed and verified on Cronos Testnet)
- ✅ 158 tests passing, 100% branch coverage
- ✅ Full Next.js frontend with 8 on-chain integrated pages
- ✅ Admin dashboard with real on-chain role detection
- ✅ Seller registration and asset creation with IPFS image uploads via Pinata
- ✅ Buyer dashboard — portfolio, pending purchases, share management
- ✅ Secondary share marketplace
- ✅ USDCFaucet — anyone can mint test USDC with one click
- ✅ Mobile-responsive with hamburger drawer navigation
- ✅ Anti-rug and AML mechanisms

### 🔄 Phase 1 — MVP & Real Estate Partnerships
**Target TVL: $2M – $10M**

- 🔄 Real estate company partnerships (5–10 verified developers and agencies)
- 🔄 Housing agency fractionalization programs
- 🔄 Account abstraction — gasless transactions for Crypto.com App users
- 🔄 Fiat on/off ramps — credit card and bank transfer support
- 🔄 AI education assistant for user onboarding and 24/7 support
- 🔄 Professional smart contract security audit
- 🔄 CRO staking integration — stake CRO to earn yield on platform fees

**Key Metrics**: 5–10 partners · 50+ properties · 1,000+ investors · $2M–$10M TVL

### 🔄 Phase 2 — Open Platform & Inspector Network
**Target TVL: $10M – $40M**

- 🔄 Individual seller registration with KYC/AML
- 🔄 Random inspector assignment — lawyers and law enforcement verify purchases
- 🔄 Cronos DeFi integration — PVF tokens as collateral in lending protocols (VVS Finance, Tectonic)
- 🔄 AI property valuation and investment recommendations
- 🔄 Geographic expansion to 5+ countries

**Key Metrics**: 500+ sellers · 20–50 verified inspectors · 5,000–10,000 investors · $10M–$40M TVL

### 🔄 Phase 3 — Ecosystem Growth & DeFi Integration
**Target TVL: $40M – $150M**

- 🔄 AMM liquidity pools for PVF tokens on Cronos DEXs (VVS Finance, PhotonSwap)
- 🔄 Fractional tokens as DeFi collateral
- 🔄 Fractional REIT products — diversified property portfolios
- 🔄 Cross-chain bridge via Cronos IBC

**Key Metrics**: 2–4 institutional partners · 20,000+ investors · $50M+ daily trading volume

### 🔄 Phase 4 — DAO & Decentralized Governance
**Target TVL: $150M – $500M+**

- 🔄 PropVera DAO — governance token distribution
- 🔄 Token-holder voting on platform parameters and fees
- 🔄 Global regulatory compliance in 20+ countries

---

## ⛽ Gas Costs (Cronos EVM)

| Function | Estimated Gas |
|----------|--------------|
| `registerSeller()` | ~50,000 |
| `createAsset()` | ~200,000 |
| `verifyAsset()` | ~50,000 |
| `buyAsset()` | ~150,000 |
| `confirmAssetPayment()` | ~180,000 |
| `createFractionalAsset()` | ~250,000 |
| `buyFractionalAsset()` | ~120,000 |
| `listSharesForSale()` | ~180,000 |
| `buyListedShares()` | ~200,000 |
| `transferShares()` | ~150,000 |
| `distributeFractionalDividends()` | ~50,000 + (N holders × ~30,000) |
| `drip()` (USDCFaucet) | ~60,000 |

---

## 🔒 Security

- **OpenZeppelin Contracts**: Industry-standard, audited implementations
- **158 Tests, 100% Branch Coverage**: Every code path tested across all contracts
- **ReentrancyGuard**: Applied to every function that moves funds or tokens
- **CEI Pattern**: Check-Effects-Interactions strictly followed throughout
- **25+ Custom Errors**: Gas-efficient descriptive error handling
- **SafeERC20**: All token transfers wrapped
- **Immutable Token Addresses**: Set at construction, cannot be changed post-deploy
- **One-Time Lock**: `setPropVera` permanently locks the fractional token after first call
- **Faucet Minter Isolation**: Only `USDCFaucet` is whitelisted as minter — not individual users

⚠️ **Smart Contract Audit Pending**. This is experimental software — do not invest significant funds until professional audits are complete.

---

## 📄 License

UNLICENSED — Proprietary software. All rights reserved.

---

## 👥 Team

**Founder & Solo Developer / Blockchain Architect**: Therock Ani
📧 anitherock44@gmail.com · [@ani_therock](https://twitter.com/ani_therock) · [therock-ani.vercel.app](https://therock-ani.vercel.app)

---

## 🙏 Acknowledgments

- **Cronos / Crypto.com** for high-speed EVM infrastructure
- **OpenZeppelin** for battle-tested smart contract libraries
- **Hardhat** for excellent Solidity development tooling
- **RainbowKit & Wagmi** for seamless Web3 frontend integration
- **Cronos Explorer** for open-source block explorer and contract verification
- **Pinata** for IPFS pinning infrastructure
- **viem** for type-safe Ethereum interactions

---

## 📞 Contact & Links

- **Live Demo**: https://prop-vera.vercel.app/
- **GitHub**: https://github.com/rocknwa/Prop-Vera
- **Network**: Cronos Testnet (Chain ID: 338)
- **RPC**: https://evm-t3.cronos.org/
- **Explorer**: https://explorer.cronos.org/testnet

---

## 🌍 Vision

PropVera envisions a world where:
- **Anyone** can invest in real estate with any amount, from anywhere
- **Geographic borders** don't limit investment opportunities
- **Cronos blockchain** provides fast, low-cost, transparent ownership records
- **Fractional ownership** democratizes access to stable, income-generating assets
- **Decentralized governance** ensures platform evolution serves community needs

We're not just building a platform — we're building a **movement** toward financial inclusion and equitable wealth creation through real estate on Cronos.

---

**Built with ❤️ on Cronos EVM**

*Making real estate investment accessible to everyone, one fraction at a time.*
