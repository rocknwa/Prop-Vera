# PropVera

**Democratizing Real Estate Investment on Polkadot Hub EVM**

[![License: UNLICENSED](https://img.shields.io/badge/License-UNLICENSED-red.svg)](LICENSE)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.28-blue.svg)](https://soliditylang.org/)
[![Polkadot](https://img.shields.io/badge/Network-Polkadot_Hub_EVM-e6007a.svg)](https://polkadot.network/)
[![Coverage](https://img.shields.io/badge/Test_Coverage-100%25_Branch-brightgreen.svg)](#testing)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js_16-black.svg)](https://nextjs.org/)

> **Invest in real estate with any amount. Own property with on-chain proof.**

PropVera is a decentralized application (DApp) that removes traditional barriers to real estate investment by enabling fractional ownership, transparent transactions, and verifiable property rights — all powered by blockchain technology on Polkadot Hub EVM.

## 🔗 Quick Links

- **Live Demo**: https://prop-vera.vercel.app/
- **Video Demo**:  
- **Pitch Deck**: https://docs.google.com/presentation/d/1Q4mf5BIHFopnL129gLiw9TEbY8MIFT_m/edit?usp=drivesdk&ouid=117370402690257904012&rtpof=true&sd=true

---

## 🏗️ Deployed Contracts

**Network**: Polkadot Hub EVM Testnet (Chain ID: 420420417)

| Contract | Address | Explorer |
|----------|---------|---------|
| `PropVera` | `0xdF6A1Da673B623D9e1c6c538f4653d4429284429` | [View on Blockscout](https://blockscout-testnet.polkadot.io/address/0xdF6A1Da673B623D9e1c6c538f4653d4429284429#code) |
| `PropVeraFractionalToken` | `0x1807F7c4984f5188e948C2e828fadE1b2F0011eb` | [View on Blockscout](https://blockscout-testnet.polkadot.io/address/0x1807F7c4984f5188e948C2e828fadE1b2F0011eb#code) |
| `MockUSDC` | `0xAdf4d9B286D4c757d5aAce5EE544318F895A0E06` | [View on Blockscout](https://blockscout-testnet.polkadot.io/address/0xAdf4d9B286D4c757d5aAce5EE544318F895A0E06#code) |

All contracts are **verified** on Blockscout with source code publicly readable.

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

PropVera leverages blockchain technology to make real estate investment:

### **Accessible**
- Fractional ownership starting with **any amount** (even as low as $5)
- Invest in multiple properties to diversify your portfolio
- No geographic restrictions — invest globally from your device
- Buy properties remotely and claim documents anytime with on-chain proof

### **Transparent**
- Every transaction recorded immutably on Polkadot Hub blockchain
- Complete ownership history and verification status publicly viewable
- Smart contracts eliminate ambiguity in agreements
- Real-time portfolio tracking

### **Liquid**
- **Secondary marketplace** for peer-to-peer share trading
- Sell your fractional ownership anytime without waiting for full property sales
- Instant settlement via smart contracts
- Ultra-low trading fees on Polkadot Hub EVM

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
- **Mint test USDC** directly from the UI — no external faucet needed
- Role-based navigation — admin dashboard auto-detects on-chain role
- Two-step approve → transact flow with clear step indicators
- Full mobile-responsive design

---

## 🚀 Competitive Edge

### **Account Abstraction — Seamless Onboarding** *(Roadmap)*
- **Gasless Transactions**: Investors don't need to hold native tokens for gas
- **Social Recovery**: Recover wallets via phone numbers or trusted contacts
- **Web2-Like Experience**: Email/phone login eliminates crypto complexity for mainstream users

### **Seamless Fiat On/Off Ramps** *(Roadmap)*
- **Direct Fiat Integration**: Buy property with credit cards or bank transfers
- **Local Payment Methods**: Support for region-specific payment rails worldwide
- **Instant Cashouts**: Sell shares and withdraw to bank accounts

### **AI-Powered User Experience** *(Roadmap)*
- **Intelligent Assistant**: AI educates and guides users through every step
- **Natural Language**: Ask questions in plain English — no technical jargon required
- **Personalized Support**: Context-aware assistance based on user journey

### **Remote Property Acquisition**
- **Buy Without Visiting**: Purchase properties anywhere in the world from your device
- **On-Chain Document Claims**: Retrieve property documents anytime with NFT proof
- **True borderless investment** with zero geographic friction

---

## 🏗️ How It Works

### For Investors

1. **Connect Wallet**: Use MetaMask, WalletConnect, or any EVM wallet
2. **Get Test USDC**: Click "🪙 Get USDC" in the navbar to mint 10,000 test USDC instantly
3. **Browse Verified Properties**: View real estate listings on the marketplace
4. **Choose Your Investment**: Buy entire properties or fractional shares
5. **Instant Ownership**: Receive NFTs (whole property) or PVF tokens (fractional shares)
6. **Earn Dividends**: Receive automated distributions proportional to your ownership
7. **Trade Anytime**: List your shares on the secondary marketplace or transfer peer-to-peer

### For Sellers

1. **Register**: Call `registerSeller()` once from the Seller dashboard
2. **Create Asset NFT**: Fill the property form — metadata encoded as base64 JSON on-chain
3. **Await Verification**: Admin reviews and verifies your listing
4. **Receive Payment**: Get paid in USDC automatically when buyers confirm (97% to seller, 3% platform fee)

### For Admins

1. **Verify Assets**: Review and approve pending seller listings
2. **Fractionalize**: Split verified assets into PVF ERC-20 tokens with custom token count
3. **Distribute Dividends**: Push USDC proportionally to all fractional holders
4. **Manage Withdrawals**: Enable/disable fractional cancellations per asset
5. **Treasury**: Withdraw platform fees to any recipient address

### Property Flow

```
Seller → registerSeller() → createAsset(tokenURI, price) → [Pending Verification]
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
- **Libraries**: OpenZeppelin v4.9.6 (ERC721URIStorage, ERC20, ReentrancyGuard, SafeERC20, Ownable)
- **Network**: Polkadot Hub EVM Testnet (Chain ID: 420420417)
- **Payment Token**: MockUSDC (6 decimals, minter-whitelisted)
- **Testing**: 123 tests, 100% branch coverage

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

**Pages**:
| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/marketplace` | Browse verified available properties |
| `/fractional` | Browse fractionalized assets |
| `/share-market` | Secondary peer-to-peer share listings |
| `/asset/[id]` | Asset detail, buy whole or fractional |
| `/dashboard` | Buyer portfolio, pending purchases, listings |
| `/seller` | Register as seller, create assets, manage listings |
| `/admin` | On-chain gated: verify, fractionalize, dividends, treasury |

---

## ✨ Core Features

### 🏠 Asset Management
- Individual seller property listings with base64 on-chain metadata
- Multi-admin verification before assets go live
- Asset delisting with automatic buyer refunds
- Real-time status tracking: created → verified → sold

### 💰 Investment Options
- **Whole property purchases**: Buy entire properties as ERC-721 NFTs
- **Two-step flow**: Pay → Confirm to receive NFT (or cancel for 99% refund)
- **Fractional ownership**: Invest in PVF token shares
- **Secondary market**: Buy/sell shares from other investors (2% platform fee)
- **Share transfers**: Send fractional shares peer-to-peer at zero fee

### 📊 Financial Features
- USDC stablecoin transactions — no crypto volatility
- Automated dividend distribution to all fractional owners
- **Transparent fees**: 3% listing · 2% trading · 1% cancellation penalty
- **MockUSDC faucet**: Mint 10,000 test USDC per click from the UI

### 🔐 Security & Verification
- Multi-admin system with separate Owner and Admin roles
- ReentrancyGuard on every financial function
- CEI (Check-Effects-Interactions) pattern throughout
- SafeERC20 wrapping all token transfers
- Anti-rug: fractional assets with investors cannot be delisted
- AML: capital withdrawals require admin-gated approval

### 🛡️ Anti-Fraud Mechanisms

#### Investor Protection (Anti-Rug)
```solidity
if (fractionalAssets[tokenId].totalTokens > 0 ||
    fractionalAssetBuyers[tokenId].length > 0)
    revert FractionalizedAssetWithBuyers();
```

#### Anti-Money Laundering
```solidity
if (buyerCanWithdraw[tokenId] == false) revert CannotWithdrawYet();
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.x
- pnpm >= 9.x
- MetaMask or any EVM-compatible wallet

### Add Polkadot Hub Testnet to MetaMask

| Field | Value |
|-------|-------|
| Network Name | Polkadot Hub Testnet |
| RPC URL | `https://services.polkadothub-rpc.com/testnet` |
| Chain ID | `420420417` |
| Currency Symbol | `DOT` |
| Block Explorer | `https://blockscout-testnet.polkadot.io` |

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
npx hardhat test
npx hardhat run scripts/deploy.js --network polkadotTestnet
```

**Frontend:**
```bash
cd frontend
pnpm install

# Create .env.local from example
cp .env.example .env.local
# Set NEXT_PUBLIC_PROPVERA_ADDRESS, NEXT_PUBLIC_FRACTIONAL_TOKEN_ADDRESS,
# NEXT_PUBLIC_USDC_ADDRESS, NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🧪 Testing

```bash
cd smart-contract

npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat coverage
```

**Results**:
```
All files  |  100%  |  100%  |  100%  |  100%
```

123 tests across 26 describe blocks — every function, branch, and custom error path covered.

---

## 📈 Roadmap

### ✅ Phase 0 — Core Protocol (Complete)
- ✅ Modular smart contract architecture
- ✅ 100% branch test coverage
- ✅ Full Next.js frontend with on-chain integration
- ✅ Admin dashboard with real on-chain role detection
- ✅ Seller registration and asset creation with NFT metadata
- ✅ Buyer dashboard — portfolio, pending purchases, share management
- ✅ Secondary share marketplace
- ✅ Deployed and verified on Polkadot Hub EVM Testnet
- ✅ Anti-rug and AML mechanisms

### 🔄 Phase 1 — MVP & Real Estate Partnerships
**Target TVL: $2M – $10M**

- 🔄 Real estate company partnerships (5–10 verified developers and agencies)
- 🔄 Housing agency fractionalization programs
- 🔄 In-platform messaging between buyers and real estate partners
- 🔄 Digital document request and delivery workflow
- 🔄 Account abstraction — gasless transactions
- 🔄 Fiat on/off ramps — credit card and bank transfer support
- 🔄 AI education assistant for user onboarding and 24/7 support
- 🔄 Professional smart contract security audit
- 🔄 Marketing launch and community building

**Key Metrics**: 5–10 partners · 50+ properties · 1,000+ investors · $2M–$10M TVL

### 🔄 Phase 2 — Open Platform & Inspector Network
**Target TVL: $10M – $40M**

- 🔄 Individual seller registration with KYC/AML
- 🔄 Random inspector assignment — lawyers and law enforcement verify purchases
- 🔄 On-chain inspection reports and compliance records
- 🔄 AI property valuation and investment recommendations
- 🔄 Multilingual AI support
- 🔄 Geographic expansion to 5+ countries

**Key Metrics**: 500+ sellers · 20–50 verified inspectors · 5,000–10,000 investors · $10M–$40M TVL

### 🔄 Phase 3 — Ecosystem Growth & DeFi Integration
**Target TVL: $40M – $150M**

- 🔄 Institutional partnerships — REITs and property management companies
- 🔄 Cross-chain USDC bridge from Ethereum, Polygon, and other EVM chains
- 🔄 Fractional tokens as DeFi collateral in lending protocols
- 🔄 Automated market makers (AMM) for instant share liquidity
- 🔄 Fractional REIT products — diversified property portfolios

**Key Metrics**: 2–4 institutional partners · 20,000+ investors · $50M+ daily trading volume

### 🔄 Phase 4 — DAO & Decentralized Governance
**Target TVL: $150M – $500M+**

- 🔄 PropVera DAO — governance token distribution
- 🔄 Token-holder voting on platform parameters and fees
- 🔄 Real estate index funds and passive investment products
- 🔄 Tokenized mortgage market — peer-to-peer home equity fractionalization
- 🔄 Global regulatory compliance in 20+ countries

**Key Metrics**: Full DAO · 100,000+ community members · 20+ countries · $150M–$500M+ TVL

---

## ⛽ Gas Costs (Polkadot Hub EVM)

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

---

## 🔒 Security

- **OpenZeppelin Contracts**: Industry-standard, audited implementations
- **100% Branch Coverage**: Every code path tested across all modules
- **ReentrancyGuard**: Applied to every function that moves funds or tokens
- **CEI Pattern**: Check-Effects-Interactions strictly followed throughout
- **25+ Custom Errors**: Gas-efficient descriptive error handling
- **SafeERC20**: All token transfers wrapped
- **Immutable Token Addresses**: Set at construction, cannot be changed post-deploy
- **One-Time Lock**: `setPropVera` permanently locks the fractional token after first call

⚠️ **Smart Contract Audit Pending**. This is experimental software — do not invest significant funds until professional audits are complete.

---

## 📄 License

UNLICENSED — Proprietary software. All rights reserved.

---

## 🤝 Contributing

Contributions welcome on specific folders:
- Smart contracts: `smart-contract/`
- Frontend UI: `frontend/`

Please open issues for bugs or feature requests.

---

## 👥 Team

**Founder & CEO / Blockchain Architect**: Therock Ani
📧 anitherock44@gmail.com · [@ani_therock](https://twitter.com/ani_therock) · [therock-ani.vercel.app](https://therock-ani.vercel.app) 

---

## 🙏 Acknowledgments

- **Polkadot / Web3 Foundation** for cross-chain EVM infrastructure
- **OpenZeppelin** for battle-tested smart contract libraries
- **Hardhat** for excellent Solidity development tooling
- **RainbowKit & Wagmi** for seamless Web3 frontend integration
- **Blockscout** for open-source block explorer and contract verification
- **viem** for type-safe Ethereum interactions

---

## 📞 Contact & Links

- **Live Demo**: https://propvera.vercel.app/
- **GitHub**: https://github.com/rocknwa/Prop-Vera
- **Network**: Polkadot Hub EVM Testnet (Chain ID: 420420417)
- **RPC**: https://services.polkadothub-rpc.com/testnet
- **Explorer**: https://blockscout-testnet.polkadot.io

---

## 🌍 Vision

PropVera envisions a world where:
- **Anyone** can invest in real estate with any amount, from anywhere
- **Geographic borders** don't limit investment opportunities
- **Blockchain technology** provides transparent, immutable ownership records
- **Fractional ownership** democratizes access to stable, income-generating assets
- **Decentralized governance** ensures platform evolution serves community needs

We're not just building a platform — we're building a **movement** toward financial inclusion and equitable wealth creation through real estate.

---

**Built with ❤️ on Polkadot Hub EVM**

*Making real estate investment accessible to everyone, one fraction at a time.*
