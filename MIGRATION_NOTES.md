# thirdweb v5 migration notes

## Inspected

- `frontend/hooks/useBuyShares.ts`: all purchase, approval, listing, transfer, and
  mint operations were using wagmi's read/write/receipt hooks. The important
  behavior to preserve is the two-step ERC-20 approval flow and the returned
  transaction hash/confirmation state.
- `frontend/hooks/useUserProfile.ts`: the profile is entirely derived from the
  connected address and contract reads; there is no off-chain user identity
  dependency. The active thirdweb account address can therefore be used for
  both an embedded smart account and an externally connected wallet.
- `frontend/lib/contracts.ts` and `frontend/lib/abis/*`: addresses remain driven
  by environment variables, ABIs remain unchanged, and the target chain ID is
  still 338. No deployed-contract interface required a change.
- All other wagmi consumers were inventoried as well (`useAssets`, navbar,
  marketplace, fractional, asset detail, dashboard, share market, seller, and
  admin) so the provider migration would not leave part of the application on
  a second wallet state.

## Decisions

- RainbowKit, wagmi, and `@wagmi/core` were removed in favor of thirdweb v5.
- Cronos Testnet is defined once in `frontend/lib/thirdweb.ts` (chain ID 338,
  TCRO, official testnet RPC/explorer) and is shared by the connection UI and
  every contract call.
- The connection modal offers email and Google through thirdweb's in-app wallet,
  plus MetaMask, WalletConnect, Coinbase Wallet, and Rabby for existing wallet
  users.
- Account abstraction is configured on the connection component with
  `sponsorGas: true`. This intentionally wires transactions through thirdweb's
  smart-account/paymaster path; the thirdweb dashboard still needs the desired
  sponsorship policy and allowed contracts/methods.
- A small compatibility layer in `frontend/lib/thirdweb-hooks.ts` exposes the
  response shape the existing UI already consumes. Underneath, reads use
  thirdweb `readContract`, writes use `prepareContractCall` plus
  `useSendTransaction`, and confirmations use `waitForReceipt`. This reduces
  migration risk in transaction-heavy screens while ensuring the active
  thirdweb account supplies the signer.
- `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` replaces the WalletConnect project ID. A
  client ID is intentionally public and should be restricted to the production
  domains in the thirdweb dashboard.

## Assumptions and follow-up configuration

- The account-abstraction configuration is applied to the connect experience,
  including externally connected wallets. This preserves external wallet
  choice while giving the application one consistent account/signer path.
- Gas sponsorship depends on thirdweb infrastructure supporting the configured
  smart-account deployment on Cronos Testnet and on a matching dashboard policy.
  If a custom bundler/paymaster is required for chain 338, provide those settings
  in the thirdweb project before enabling sponsorship in production.
- Package-registry access was blocked in the implementation environment, so the
  checked-in pnpm lockfile could not be regenerated and the new package could
  not be downloaded there. Run `pnpm install` in `frontend/` with registry
  access to resolve thirdweb v5 and refresh `pnpm-lock.yaml`, then run the build
  with a real `NEXT_PUBLIC_THIRDWEB_CLIENT_ID`.

### Lockfile verification retry

The lockfile follow-up was retried with a normal, online `pnpm install`. The
environment's configured proxy returned HTTP 403 for
`https://registry.npmjs.org/thirdweb`. The npm mirror, Yarn registry, unpkg,
jsDelivr, and the thirdweb GitHub repository were also blocked by the same
proxy. Bypassing the proxy was attempted, but the sandbox has no direct DNS or
network route. No thirdweb package metadata or tarball exists in the local pnpm
cache.

Because neither the published thirdweb dependency graph nor package artifacts
were available, the stale lockfile was **not** replaced with a fabricated,
unverifiable entry. Consequently `pnpm install`, TypeScript compilation, and the
Next.js build cannot be confirmed in this environment; this migration must not
be treated as build-verified until the install and build above succeed in an
environment with npm registry access.

## Unchanged scope

- No file under `smart-contract/` or `indexer/` was modified.
- Contract addresses, ABIs, token decimal conversions, and application business
  flows were not changed.

## Native TCRO onboarding follow-up

### Inspected and implemented

- Re-inspected `frontend/lib/thirdweb.ts`, `frontend/components/connect-button-client.tsx`,
  and `frontend/components/navbar.tsx`. Both thirdweb in-app email/Google wallets
  and the existing external-wallet choices expose the same active account, while
  the navbar's Get USDC button calls the on-chain `drip` function and therefore
  requires native gas.
- Added one app-level native-gas provider rather than page-specific checks. It
  reads the active address's balance from the configured Cronos Testnet RPC with
  viem `eth_getBalance` semantics on chain 338. A balance below 0.01 TCRO is
  treated as insufficient for onboarding; this is a conservative UI threshold,
  not a guarantee of the gas required by every possible transaction.
- The provider re-fetches after an account changes and whenever the window gains
  focus or the document becomes visible. The warning is derived directly from
  the latest successful balance response, so it disappears when that response
  reaches the threshold. No claim is made that the faucet itself reports back to
  PropVera or that background refresh occurs while the tab remains hidden.
- The responsive global notice shows the complete, manually selectable address.
  Its primary action attempts to copy that address and opens the faucet, and it
  reports clipboard success or failure. No address-prefill parameter is used.
  Get USDC remains otherwise unchanged, but is disabled with an explicit gas
  explanation while the TCRO warning is active.

### Faucet verification and limitations

- The configured URL is `https://cronos.org/faucet`, the Cronos-hosted test-token
  faucet URL. No undocumented query parameter was added. Verification from this
  implementation environment was attempted with both the web lookup tool and a
  direct HTTPS request on 2026-09-24; the lookup service returned HTTP 401 and
  the environment proxy returned HTTP 403, respectively. Consequently the URL
  could not be opened end-to-end here and URL prefill support was **not** claimed.
  The address stays visible and selectable if either the clipboard or faucet is
  unavailable.
