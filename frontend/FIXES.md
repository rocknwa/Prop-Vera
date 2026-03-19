# Contract Integration Fixes

## Changes Made

### 1. lib/contracts.ts
- ✅ Fixed export names to match codebase imports:
  - `PROPVERA_CONTRACT_ADDRESS` (reads from `NEXT_PUBLIC_PROPVERA_ADDRESS`)
  - `PROPVERA_FRACTIONAL_TOKEN_ADDRESS` (reads from `NEXT_PUBLIC_FRACTIONAL_TOKEN_ADDRESS`)
  - `MOCK_USDC_ADDRESS` (reads from `NEXT_PUBLIC_USDC_ADDRESS`)
- ✅ ABI re-exports with proper names:
  - `PROPVERA_ABI`
  - `MOCK_USDC_ABI` (alias for MOCKUSDC_ABI)
  - `PROPVERA_FRACTIONAL_TOKEN_ABI` (alias for FRACTIONAL_TOKEN_ABI)
- ✅ Removed hardcoded fallback addresses - now reads from environment only
- ✅ Kept error message mapping and parsing utilities intact

### 2. lib/wagmi.ts
- ✅ Updated to read `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` from environment using non-null assertion (`!`)
- ✅ Correct RPC endpoints for Polkadot Hub Testnet
- ✅ Proper chain configuration (ID: 420420417)

### 3. hooks/useStaking.ts
- ✅ Deleted - no staking contract exists in PropVera spec
- ✅ Was importing non-existent `STAKING_ABI`

### 4. Verified Imports
- ✅ hooks/useBuyShares.ts - correctly imports `PROPVERA_CONTRACT_ADDRESS` and `PROPVERA_ABI`
- ✅ hooks/useAssets.ts - correctly imports `PROPVERA_CONTRACT_ADDRESS` and `PROPVERA_ABI`
- ✅ hooks/useUserProfile.ts - uses only wagmi hooks, no contract imports needed
- ✅ app/dashboard/page.tsx - uses only wagmi hooks

## Environment Variables Required

Set these in `.env.local`:

```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<your_project_id>
NEXT_PUBLIC_PROPVERA_ADDRESS=0xdF6A1Da673B623D9e1c6c538f4653d4429284429
NEXT_PUBLIC_FRACTIONAL_TOKEN_ADDRESS=0x1807F7c4984f5188e948C2e828fadE1b2F0011eb
NEXT_PUBLIC_USDC_ADDRESS=0xAdf4d9B286D4c757d5aAce5EE544318F895A0E06
```

## Status
- All import names have been unified and verified
- No hardcoded addresses in frontend code
- Environment variables properly configured
- Ready for TypeScript compilation check
