# PropVera — Decentralized Real Estate Platform

A decentralized application (DApp) for real estate asset management, enabling non-custodial listing, fractional ownership, secondary market trading, and automated dividend distribution on the **Polkadot Hub EVM** using USDC as the payment token. Built with Solidity ^0.8.28, Hardhat, and OpenZeppelin, the platform supports secure, transparent real estate transactions with features like multi-admin verification, seller registration, comprehensive portfolio tracking, peer-to-peer share trading, and automated dividend distribution.

[![Solidity](https://img.shields.io/badge/Solidity-^0.8.28-blue)](https://docs.soliditylang.org/)
[![OpenZeppelin](https://img.shields.io/badge/OpenZeppelin-v4.9.6-green)](https://openzeppelin.com/contracts/)
[![Hardhat](https://img.shields.io/badge/Hardhat-v2.26.3-yellow)](https://hardhat.org/)
[![Polkadot](https://img.shields.io/badge/Polkadot-Hub%20EVM-e6007a)](https://polkadot.network/)
[![Coverage](https://img.shields.io/badge/Coverage-100%25%20Branch-brightgreen)](#testing)
[![License](https://img.shields.io/badge/License-UNLICENSED-red)](LICENSE)

## Table of Contents
- [Project Overview](#project-overview)
- [Features](#features)
- [Architecture](#architecture)
- [Smart Contracts](#smart-contracts)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Testing](#testing)
- [Deployment](#deployment)
- [Deployed Contracts](#deployed-contracts)
- [Security](#security)
- [Gas Optimization](#gas-optimization)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## Project Overview

PropVera is a comprehensive decentralized platform designed to revolutionize real estate investment by enabling:

- **Property Tokenization**: Convert real estate assets into NFTs (ERC-721) with detailed metadata
- **Fractional Ownership**: Split properties into ERC-20 tokens for accessible investment
- **Secondary Market Trading**: Peer-to-peer marketplace for buying and selling fractional shares
- **Direct Share Transfers**: Off-platform transfer of shares between users
- **Secure Transactions**: All payments handled in USDC stablecoin for price stability
- **Multi-Admin System**: Distributed verification and management authority
- **Dividend Distribution**: Automated proportional payouts to fractional investors
- **Complete Transparency**: All transactions and ownership tracked on-chain
- **Polkadot Integration**: Built on Polkadot Hub EVM for cross-chain interoperability

### Key Goals

1. **Democratize Real Estate Investment**: Lower barriers through fractional ownership
2. **Enable Liquidity**: Secondary market for trading fractional shares
3. **Ensure Security**: OpenZeppelin battle-tested contracts + ReentrancyGuard
4. **Maintain Transparency**: All transactions publicly verifiable on-chain
5. **Non-Custodial Architecture**: Sellers retain control until sale completion
6. **Scalable Modular Design**: Abstract modules with shared storage layout
7. **100% Branch Coverage**: Production-grade test suite with full branch coverage

### Platform Economics

| Action | Fee |
|--------|-----|
| Full asset sale | 3% listing fee → platform |
| Buyer cancellation | 1% penalty → platform |
| Secondary share trade | 2% trading fee → platform |
| Fractional primary purchase | 0% — seller receives full payment |
| Dividend distribution | 0% — 100% distributed to token holders |
| Direct peer-to-peer transfer | 0% |

---

## Features

### Core Features

#### 🏠 Asset Management
- **Asset Creation**: Registered sellers mint NFTs representing real estate properties
- **Metadata Storage**: IPFS integration for decentralized asset information
- **Multi-Admin Verification**: Distributed authority for asset approval
- **Asset Delisting**: Admins can remove listings with automatic buyer refunds
- **Status Tracking**: Real-time monitoring of asset lifecycle (created → verified → sold)
- **Withdrawal Control**: Admin-controlled withdrawal permissions for fractional buyers

#### 👥 User Management
- **Seller Registration**: One-time registration required to list properties
- **Multi-Admin System**: Owner can add/remove multiple admins
- **Seller Metrics**: Track confirmed and canceled purchase counts per seller
- **Portfolio Views**: Comprehensive dashboards for buyers and sellers
- **Fractional Ownership Tracking**: View all investments with ownership percentages

#### 💰 Transaction Handling
- **Full Asset Purchase**: Buy entire property ownership in USDC
- **Two-Step Purchase Flow**: Payment lock → buyer confirmation → ownership transfer
- **Cancellation Mechanism**: Buyers can cancel with 1% penalty
- **Automatic Fee Distribution**: Platform fees auto-sent to owner on confirmation
- **Escrow Protection**: Secure USDC holding during pending transactions

#### 🔀 Fractional Ownership
- **Asset Fractionalization**: Admins split assets into ERC-20 tokens
- **Partial Purchases**: Buy any amount of available tokens
- **Dynamic Pricing**: Price per token = total asset price / token count
- **Ownership Tracking**: Precise percentage calculations using 1e18 scale
- **Controlled Cancellation**: Fractional buyers can exit when admin enables withdrawal
- **Full Ownership Conversion**: Single buyer acquiring all tokens receives the NFT
- **Buyer Portfolio**: Track all fractional investments with percentages and values

#### 🛒 Secondary Market Trading
- **List Shares for Sale**: Fractional owners list shares on the platform marketplace
- **Buy Listed Shares**: Purchase shares from other investors at listed prices
- **Escrow Protection**: Shares held in contract during listing period
- **Cancel Listings**: Sellers can cancel active listings and retrieve shares
- **Platform Fee**: 2% on successful trades (seller receives 98%, platform 2%)
- **Market Discovery**: View all active listings across all assets
- **Asset-Specific Listings**: Filter listings by specific property

#### 📤 Direct Share Transfers
- **Peer-to-Peer Transfers**: Transfer shares directly to any address
- **Zero Fees**: No platform fees for direct transfers
- **Automatic Tracking**: Recipient automatically added to buyer list
- **Off-Platform Sales**: Enable private transactions outside the marketplace

#### 💸 Dividend System
- **Proportional Distribution**: USDC dividends split by ownership percentage
- **Batch Payments**: Single transaction distributes to all fractional owners
- **Automated Calculations**: Contract handles all proportional math on-chain
- **Admin Control**: Only admins can trigger distributions
- **Zero-Balance Skip**: Holders with zero balance are skipped automatically

#### 📊 Advanced Queries
- **Asset Display Info**: Complete asset details including fractional data
- **Available Assets**: Filter for verified, unsold properties
- **Fractionalized Assets**: List all assets with partial ownership
- **Buyer Portfolio**: All fractional investments with percentages and values
- **Seller Dashboard**: View all owned assets with status
- **Fractional Buyer Lists**: All investors in a property with their stakes
- **Share Listings**: All active share listings (by asset or platform-wide)
- **Seller Metrics**: Confirmed and canceled purchase counts

### Security Features

- ✅ **ReentrancyGuard**: Protection on all financial functions
- ✅ **Access Control**: Owner and multi-admin role management
- ✅ **Custom Errors**: Gas-efficient error handling (25+ distinct errors)
- ✅ **Input Validation**: Comprehensive parameter checks
- ✅ **SafeERC20**: OpenZeppelin's secure token transfer wrapper
- ✅ **Approval Checks**: Verify NFT and token approvals before operations
- ✅ **State Validation**: Prevent invalid state transitions
- ✅ **Escrow Protection**: Secure asset holding during listings
- ✅ **Address Validation**: Prevent transfers to zero address or self
- ✅ **Balance Verification**: Check sufficient balances before all operations
- ✅ **Immutable References**: Token addresses set once at deploy, never changeable
- ✅ **PropVera Lock**: `setPropVera` callable only once — permanently locked post-deploy
- ✅ **Minter Whitelist**: MockUSDC mint access controlled via whitelist

---

## Architecture

### Modular Contract Structure

```
contracts/
│
├── core/
│   └── PropVera.sol              ← Main contract, composes all modules
│
├── modules/
│   ├── AssetMarketplace.sol      ← Listing, verification, purchase flow
│   ├── Fractionalization.sol     ← Fractional tokens, dividends
│   └── ShareTrading.sol          ← Secondary market, P2P transfers
│
├── storage/
│   └── PropVeraStorage.sol       ← Shared storage layout (all modules)
│
├── types/
│   └── PropVeraTypes.sol         ← Structs: RealEstateAsset, FractionalAsset, ShareListing…
│
├── errors/
│   └── PropVeraErrors.sol        ← All custom errors
│
├── events/
│   └── PropVeraEvents.sol        ← All events
│
├── libraries/
│   └── ConversionLib.sol         ← USDC (6 dec) ↔ Token (18 dec) conversions
│
├── interfaces/
│   └── IPropVera.sol             ← External interface
│
└── tokens/
    ├── PropVeraFractionalToken.sol  ← ERC-20 fractional ownership token (PVF)
    └── MockUSDC.sol                 ← Mock USDC for testing (6 dec, minter whitelist)
```

### Design Patterns

**Abstract Module Composition**: `PropVera.sol` inherits three abstract modules (`AssetMarketplace`, `Fractionalization`, `ShareTrading`). Each module declares internal abstract function stubs (e.g., `_usdc()`, `_ownerOf721()`) that `PropVera.sol` satisfies — bridging ERC-721 and token state without duplication.

**Shared Storage Layout**: All modules inherit `PropVeraStorage`, ensuring a single consistent storage slot layout. This keeps the inheritance diamond safe and allows future upgradeability patterns.

**Immutable Token References**: `realEstateToken` and `usdcToken` are `immutable` — resolved at construction to a `PUSH20` bytecode instruction instead of an `SLOAD`, saving gas on every call.

### System Design

```
┌──────────────────────────────────────────────────────────────┐
│                        PropVera.sol                          │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ AssetMarketplace │  │ Fractionalization │                 │
│  └──────────────────┘  └──────────────────┘                 │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │  ShareTrading    │  │ PropVeraStorage   │                 │
│  └──────────────────┘  └──────────────────┘                 │
│  ┌──────────────┐  ┌────────────────┐  ┌─────────────────┐  │
│  │   ERC721     │  │  ERC721Holder  │  │ ReentrancyGuard │  │
│  │ URIStorage   │  │                │  │                 │  │
│  └──────────────┘  └────────────────┘  └─────────────────┘  │
└──────────────────────────────────────────────────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
  │ PropVeraFrac-    │  │   USDC Token     │  │  Asset Metadata  │
  │ tionalToken      │  │   (ERC-20)       │  │  (IPFS/HTTP)     │
  │ (ERC-20, PVF)    │  │                  │  │                  │
  └──────────────────┘  └──────────────────┘  └──────────────────┘
```

### Data Flow

#### Asset Listing Flow
```
Seller → registerSeller() → createAsset() → [Pending Verification]
                                                      ↓
                                          Admin → verifyAsset()
                                                      ↓
                                                [Available]
                                               ↙           ↘
                                         buyAsset()   createFractionalAsset()
```

#### Full Purchase Flow
```
Buyer → buyAsset() → [USDC Locked in Escrow]
            ↓
   confirmAssetPayment() → [NFT Transfer + Payment to Seller (97%) + Fee (3%)]
            OR
   cancelAssetPurchase() → [Refund (99%) + Penalty to Platform (1%)]
```

#### Fractional Purchase & Trading Flow
```
Admin → createFractionalAsset() → [ERC-20 Tokens Minted to Contract]
                                              ↓
Multiple Buyers → buyFractionalAsset() → [Tokens Distributed]
                                              ↓
                                      [Secondary Market]
                              ┌───────────────┴───────────────┐
                              ↓                               ↓
                    listSharesForSale()               transferShares()
                    [Escrow: shares locked]           [Instant, no fee]
                              ↓
                    buyListedShares()
                    [2% fee to platform]
                              ↓
Admin → distributeFractionalDividends() → [USDC proportionally to all holders]
```

---

## Smart Contracts

### PropVera.sol (Main Contract)

**Main contract** composing all modules and satisfying their abstract bridges.

| Property | Value |
|----------|-------|
| Contract Name | `PropVera` |
| NFT Name / Symbol | `PropVeraAssetToken` / `PVT` |
| Inherits | `AssetMarketplace`, `Fractionalization`, `ShareTrading`, `ERC721URIStorage`, `ERC721Holder`, `Ownable` |
| Public/External Functions | 40+ |
| Events | 13 distinct types |
| Custom Errors | 25+ |

**Key Constants:**
```solidity
LISTING_FEE_PERCENTAGE          = 3    // 3% on full asset sales
CANCELLATION_PENALTY_PERCENTAGE = 1    // 1% on cancellations
SHARE_TRADING_FEE_PERCENTAGE    = 2    // 2% on secondary market trades
PERCENTAGE_DENOMINATOR          = 100
PERCENTAGE_SCALE                = 1e18 // Precision for ownership percentages
```

**Key State Variables:**
```solidity
PropVeraFractionalToken public immutable realEstateToken;
IERC20                  public immutable usdcToken;

mapping(uint256 => RealEstateAsset)  public realEstateAssets;
mapping(uint256 => FractionalAsset)  public fractionalAssets;
mapping(uint256 => ShareListing)     public shareListings;
mapping(address => bool)             public sellers;
mapping(address => bool)             public isAdmin;
mapping(uint256 => bool)             public buyerCanWithdraw;
```

### PropVeraFractionalToken.sol

**ERC-20 token** representing fractional ownership shares.

| Property | Value |
|----------|-------|
| Token Name / Symbol | `PropVeraFractionalToken` / `PVF` |
| Standard | ERC-20 (OpenZeppelin) |
| Decimals | 18 |
| Minting | Owner or PropVera contract only |
| Lock | `setPropVera` callable only once — address permanently locked |

### MockUSDC.sol

**Mock USDC** for testing and staging environments.

| Property | Value |
|----------|-------|
| Token Name / Symbol | `Mock USDC` / `USDC` |
| Standard | ERC-20 |
| Decimals | 6 (matches real USDC) |
| Minting | Whitelist-controlled (`isMinter` mapping) |
| Access | `setMinter(address, bool)` — owner only |

> ⚠️ `MockUSDC` is for **testing and testnet only**. Production deployments should use a real bridged USDC contract.

---

## Prerequisites

### Required Software

- **Node.js**: v20.0.0 or higher
- **npm**: v8.x or higher
- **Git**: Latest stable version
- **Ethereum Wallet**: MetaMask or any EVM-compatible wallet

### Development Tools

- **Hardhat**: v2.26.3
- **Solidity**: ^0.8.28
- **OpenZeppelin Contracts**: v4.9.6
- **Hardhat Toolbox**: v5.0.0

### Recommended IDE Setup

VS Code with:
- Solidity by Juan Blanco
- Hardhat Solidity
- ESLint + Prettier

---

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/rocknwa/Prop-Vera.git
cd Prop-Vera
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Verify Installation

```bash
npx hardhat --version
```

### 4. Compile Contracts

```bash
npx hardhat compile
```

---

## Configuration

### Environment Setup

Create a `.env` file in the project root:

```env
# Deployer private key (DO NOT COMMIT — add .env to .gitignore)
PRIVATE_KEY=0xyour_private_key_here
```

> The `.env` file must live in the same directory as `hardhat.config.js`.
> Do **not** wrap the value in quotes.

### hardhat.config.js

```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const { PRIVATE_KEY } = process.env;

module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "cancun",
    },
  },
  networks: {
    polkadotTestnet: {
      url: "https://services.polkadothub-rpc.com/testnet",
      chainId: 420420417,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      ignition: {
        blockPollingInterval: 1_000,
        timeBeforeBumpingFees: 3 * 60 * 1_000,
        maxFeeBumps: 4,
        requiredConfirmations: 1,
      },
    },
  },
  etherscan: {
    apiKey: { polkadotTestnet: "no-api-key-needed" },
    customChains: [
      {
        network: "polkadotTestnet",
        chainId: 420420417,
        urls: {
          apiURL: "https://blockscout-testnet.polkadot.io/api",
          browserURL: "https://blockscout-testnet.polkadot.io/",
        },
      },
    ],
  },
};
```

---

## Testing

### Run All Tests

```bash
npx hardhat test
```

### Run Specific Test File

```bash
npx hardhat test test/PropVera.test.js
```

### Run with Gas Reporting

```bash
REPORT_GAS=true npx hardhat test
```

### Generate Coverage Report

```bash
npx hardhat coverage
```

### Coverage Results

```
------------------------------|----------|----------|----------|----------|
File                          |  % Stmts | % Branch |  % Funcs |  % Lines |
------------------------------|----------|----------|----------|----------|
 contracts/                   |      100 |      100 |      100 |      100 |
  PropVera.sol                |      100 |      100 |      100 |      100 |
 contracts/errors/            |      100 |      100 |      100 |      100 |
 contracts/events/            |      100 |      100 |      100 |      100 |
 contracts/interfaces/        |      100 |      100 |      100 |      100 |
 contracts/libraries/         |      100 |      100 |      100 |      100 |
 contracts/modules/           |      100 |      100 |      100 |      100 |
 contracts/storage/           |      100 |      100 |      100 |      100 |
 contracts/tokens/            |      100 |      100 |      100 |      100 |
 contracts/types/             |      100 |      100 |      100 |      100 |
------------------------------|----------|----------|----------|----------|
All files                     |      100 |      100 |      100 |      100 |
------------------------------|----------|----------|----------|----------|
```

**123 tests** across 26 describe blocks covering:

- ✅ Seller registration and validation
- ✅ Asset creation and metadata
- ✅ Admin verification workflows
- ✅ Full asset purchase flow
- ✅ Purchase cancellation with penalties
- ✅ Fractional asset creation
- ✅ Fractional token purchases
- ✅ Controlled fractional cancellations
- ✅ Share listing creation and management
- ✅ Marketplace share purchases with fees
- ✅ Direct share transfers
- ✅ Listing cancellations
- ✅ Dividend distribution (all paths including sold-asset and zero-balance)
- ✅ Asset delisting with buyer refunds
- ✅ Access control enforcement
- ✅ All custom error paths
- ✅ `isApprovedForAll` vs `approve` alternative paths
- ✅ MockUSDC minter whitelist
- ✅ PropVeraFractionalToken lock mechanism
- ✅ Display and portfolio view functions

---

## Deployment

### Local Deployment

```bash
# Terminal 1: Start local node
npx hardhat node

# Terminal 2: Deploy
npx hardhat run scripts/deploy.js --network localhost
```

### Testnet Deployment

```bash
npx hardhat run scripts/deploy.js --network polkadotTestnet
```

The deploy script:
1. Deploys `PropVeraFractionalToken`
2. Deploys `MockUSDC`
3. Deploys `PropVera` with both token addresses
4. Calls `setPropVera` to permanently wire the fractional token
5. Calls `setMinter` to grant PropVera minting rights on MockUSDC
6. Adds both admin addresses

### Contract Verification

```bash
# PropVeraFractionalToken
npx hardhat verify --network polkadotTestnet 0xAdf4d9B286D4c757d5aAce5EE544318F895A0E06  

# MockUSDC
npx hardhat verify --network polkadotTestnet 0x1807F7c4984f5188e948C2e828fadE1b2F0011eb  

# PropVera (with constructor args)
npx hardhat verify --network polkadotTestnet 0xdF6A1Da673B623D9e1c6c538f4653d4429284429 ` 
  "0x1807F7c4984f5188e948C2e828fadE1b2F0011eb" ` 
  "0xAdf4d9B286D4c757d5aAce5EE544318F895A0E06" 
```

---

## Deployed Contracts

**Network**: Polkadot Hub EVM Testnet (Chain ID: 420420417)

| Contract | Address | Explorer |
|----------|---------|---------|
| `PropVera` | `0xdF6A1Da673B623D9e1c6c538f4653d4429284429` | [View on Blockscout](https://blockscout-testnet.polkadot.io/address/0xdF6A1Da673B623D9e1c6c538f4653d4429284429#code) |
| `PropVeraFractionalToken` | `0x1807F7c4984f5188e948C2e828fadE1b2F0011eb` | [View on Blockscout](https://blockscout-testnet.polkadot.io/address/0x1807F7c4984f5188e948C2e828fadE1b2F0011eb#code) |
| `MockUSDC` | `0xAdf4d9B286D4c757d5aAce5EE544318F895A0E06` | [View on Blockscout](https://blockscout-testnet.polkadot.io/address/0xAdf4d9B286D4c757d5aAce5EE544318F895A0E06#code) |

All contracts are **verified** on Blockscout. Source code is publicly readable and ABI-accessible directly from the explorer.

---

## Security

### Security Measures

1. **OpenZeppelin Contracts**: Industry-standard, audited implementations
2. **ReentrancyGuard**: Applied to every function that moves funds or tokens
3. **CEI Pattern**: Check-Effects-Interactions strictly followed throughout
4. **Multi-Admin Access Control**: Owner + multiple admins with separate privilege levels
5. **Custom Errors**: Gas-efficient, descriptive error messages (25+)
6. **Input Validation**: Every external/public function validates all parameters
7. **SafeERC20**: Wraps all ERC-20 transfers to handle non-standard tokens
8. **Escrow Protection**: Shares and USDC held in contract during pending operations
9. **Address Validation**: Zero address and self-transfer checks on all recipient inputs
10. **Balance Checks**: Verified before every transfer operation
11. **Immutable Token Addresses**: Set at construction, cannot be changed
12. **One-Time PropVera Lock**: `setPropVera` permanently locked after first call

### Known Considerations

- **Admin Trust**: Admins hold significant privileges (verify, fractionalize, delist, dividend distribution, withdrawal control)
- **Push Dividend Pattern**: `distributeFractionalDividends` loops over all holders — gas cost grows linearly with buyer count; recommend off-chain Merkle-drop for large holder sets
- **MockUSDC**: For testing only — replace with real bridged USDC on mainnet
- **Token URI Immutability**: Asset metadata cannot be updated after minting
- **Escrow Period**: Listed shares are locked in the contract until purchase or cancellation

---

## Gas Optimization

### Techniques Applied

| Technique | Impact |
|-----------|--------|
| `immutable` token references | Replaces SLOAD with PUSH20 per read |
| Storage reads cached in locals | Reduces repeated SLOADs in multi-read paths |
| `external` instead of `public` on view functions | Uses calldata, avoids memory copy |
| `unchecked { ++i }` in loops | Saves ~30 gas per loop iteration |
| Custom errors instead of strings | Saves ~200 gas per revert |
| Struct boolean packing | `seller` + `sold` + `verified` in same storage slot |
| Module bridge inlining | Abstract internal functions → zero call overhead |
| Single-pass array sizing | Count then allocate — avoids dynamic resizing |

### Estimated Gas Costs (Polkadot Hub EVM)

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
| `cancelShareListing()` | ~100,000 |
| `distributeFractionalDividends()` | ~50,000 + (N holders × ~30,000) |

---

## Contributing

### Development Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and test thoroughly
4. Run coverage: `npx hardhat coverage`
5. Commit: `git commit -m 'feat: add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Standards

- Follow the Solidity style guide
- Add NatSpec comments for all public/external functions
- Include unit tests for every new feature
- Maintain **100% branch coverage**
- Update this README for any API changes
- All PRs must pass `npx hardhat test` and `npx hardhat coverage`

### Pull Request Checklist

- [ ] All tests pass (`npx hardhat test`)
- [ ] 100% branch coverage maintained
- [ ] New tests added for new features and error paths
- [ ] Documentation updated
- [ ] No `console.log` in production contracts
- [ ] Gas optimizations considered
- [ ] Verified on Polkadot Hub testnet before mainnet PR

---

## License

**UNLICENSED** — Proprietary. Not licensed for public use, modification, or distribution without explicit permission from the author.

---

## Contact

**Author**: Therock Ani

- **GitHub**: [@rocknwa](https://github.com/rocknwa)
- **Twitter**: [@ani_therock](https://twitter.com/ani_therock)
- **Portfolio**: [therock-ani.vercel.app](https://therock-ani.vercel.app)
- **LinkedIn**: [linkedin.com/in/therock-ani-13336224b](https://linkedin.com/in/therock-ani-13336224b)

---

## Acknowledgments

- **OpenZeppelin** — For secure, audited smart contract libraries
- **Hardhat** — For excellent Solidity development tooling
- **Polkadot** — For EVM-compatible cross-chain infrastructure
- **Blockscout** — For open-source block explorer and contract verification

---

## Resources

- [Polkadot Hub EVM Docs](https://docs.polkadot.network)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js Documentation](https://docs.ethers.io)
- [Blockscout Explorer](https://blockscout-testnet.polkadot.io)

---

*Built with ❤️ by Therock Ani | Making real estate investment accessible to everyone* 🏠🌍