# PropVera Frontend

A Next.js 16 application for decentralized real estate investment on Polkadot Hub blockchain.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Blockchain**: Wagmi v2 + RainbowKit
- **Styling**: Tailwind CSS
- **UI Components**: Custom components + shadcn/ui patterns
- **Data Fetching**: React Query + wagmi hooks
- **Language**: TypeScript

## Project Structure

```
frontend/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout with providers
│   ├── providers.tsx      # Wagmi and React Query setup
│   ├── page.tsx           # Home page
│   ├── dashboard/         # Buyer dashboard
│   ├── marketplace/       # Real estate marketplace
│   └── globals.css        # Global styles
├── components/
│   ├── ui/                # Reusable UI components
│   ├── navbar.tsx         # Navigation bar
│   ├── asset-card.tsx     # Property card component
│   ├── stat-card.tsx      # Dashboard stat card
│   └── transaction-item.tsx
├── lib/
│   ├── wagmi.ts          # Wagmi configuration
│   ├── contracts.ts      # Contract ABIs and addresses
│   ├── types.ts          # TypeScript types
│   ├── utils.ts          # Utility functions
│   └── api.ts            # API client
├── hooks/
│   ├── useAssets.ts      # Asset contract hooks
│   ├── useBuyShares.ts   # Buy shares hook
│   ├── useStaking.ts     # Staking hooks
│   └── useUserProfile.ts # User profile hook
└── public/               # Static assets
```

## Environment Variables

Create a `.env.local` file in the frontend directory:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_PROPVERA_ADDRESS=0x...
NEXT_PUBLIC_STAKING_ADDRESS=0x...
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_CHAIN_ID=5135
```

## Getting Started

### Installation

```bash
cd frontend
pnpm install
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
pnpm build
pnpm start
```

## Key Features

### 1. Wallet Integration
- Connect wallet using RainbowKit
- Supports Polkadot Hub Testnet
- Multi-wallet support (MetaMask, WalletConnect, etc.)

### 2. Marketplace
- Browse real estate properties
- Filter by property type
- View detailed property information
- Calculate investment amounts

### 3. Dashboard
- View investment portfolio
- Track earnings and gains
- View transaction history
- Monitor active investments

### 4. Smart Contract Interaction
- Buy property shares
- Stake tokens
- Claim rewards
- Track on-chain transactions

## Components

### UI Components
- `Button` - Styled button with variants
- `Card` - Container component
- `Badge` - Status indicator
- `Spinner` - Loading indicator

### Feature Components
- `Navbar` - Navigation with wallet connection
- `AssetCard` - Property listing card
- `StatCard` - Dashboard metric card
- `TransactionItem` - Transaction list item

## Hooks

### Custom Hooks
- `useAssets()` - Fetch property data
- `useBuyShares()` - Buy property shares
- `useStaking()` - Stake and unstake tokens
- `useUserProfile()` - Fetch user data

## API Integration

The frontend communicates with a backend API for:
- User profiles and authentication
- Portfolio data
- Transaction records
- Asset information

API endpoints are defined in `lib/api.ts`.

## Smart Contracts

Contract ABIs and addresses are managed in `lib/contracts.ts`. Update these with actual contract addresses after deployment.

### PropVera Contract
- `createAsset()` - List new property
- `buyShares()` - Purchase property shares
- `getAssetDetails()` - Fetch property details

### Staking Contract
- `stake()` - Stake tokens
- `unstake()` - Withdraw staked tokens
- `claimRewards()` - Claim staking rewards

## Development Guidelines

### Adding New Pages

1. Create directory under `app/`
2. Add `page.tsx` file
3. Import Navbar component
4. Use custom hooks for data fetching

### Adding New Components

1. Create component in `components/`
2. Use TypeScript with proper types
3. Use Tailwind CSS for styling
4. Follow component patterns in existing files

### Data Fetching

- Use wagmi hooks for contract interactions
- Use `useUserProfile()` for user data
- Use `apiCall()` for backend API calls
- Use React Query for state management

## Deployment

Deploy to Vercel:

```bash
vercel
```

Ensure all environment variables are set in Vercel project settings.

## Performance Optimization

- Next.js Image component for images
- Dynamic imports for large components
- React Query caching for API calls
- Tailwind CSS purging in production

## Security

- Input validation on forms
- Proper error handling
- Environment variable management
- RLS on backend (if using database)

## Contributing

Follow these patterns when adding features:
- Use TypeScript for type safety
- Write components as functional components
- Use hooks for state management
- Follow existing code style
- Test on Polkadot Hub Testnet

## License

MIT
