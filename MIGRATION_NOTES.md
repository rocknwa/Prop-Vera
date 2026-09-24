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

- The originally configured URL was `https://cronos.org/faucet`. No undocumented
  query parameter was added. Verification from this
  implementation environment was attempted with both the web lookup tool and a
  direct HTTPS request on 2026-09-24; the lookup service returned HTTP 401 and
  the environment proxy returned HTTP 403, respectively. Consequently the URL
  could not be opened end-to-end here and URL prefill support was **not** claimed.
  The address stays visible and selectable if either the clipboard or faucet is
  unavailable.

### Connected-state runtime crash follow-up

- The reported `AccountProviderContext not found` exception was traced to the
  installed `thirdweb@5.121.4` ConnectButton's connected-account presentation.
  `NativeGasProvider` only consumes `useActiveAccount` and its own React context;
  it does not import or render thirdweb's `AccountName`, `AccountAvatar`, or
  `AccountProvider`. The application likewise does not use those composable
  account UI components. The error appears only when the default ConnectButton
  changes from its disconnected sign-in UI to its connected-account UI, which
  identifies that library branch—not the native-balance context—as the source.
- The whole application was deliberately **not** wrapped in `AccountProvider`.
  That provider belongs around thirdweb's composable account-display children,
  and adding it globally would hide rather than correct the ownership mismatch.
  PropVera now uses the existing ConnectButton only while disconnected, retaining
  its email, Google, MetaMask, WalletConnect, Coinbase Wallet, and Rabby choices.
  Once `useActiveAccount` reports success, a local connected-address/disconnect
  control replaces the faulty thirdweb presentation. The active thirdweb account
  itself remains unchanged, so native-balance checks and contract signing still
  use the same email/social or external wallet address.
- Runtime-path verification was based on the explicit state boundary: the
  connected branch no longer mounts ConnectButton (and therefore cannot mount its
  failing AccountName/AccountAvatar path), while the disconnected branch retains
  the same client, chain 338, and wallet configuration. End-to-end authentication
  with real email, Google, and third-party wallet credentials is not automatable
  in this non-interactive environment; those paths share the same post-connect
  `useActiveAccount` branch and are therefore covered by the same fix. Balance
  focus/visibility refresh and the low-TCRO USDC guard were left intact.
- The dependency install was also retried for this follow-up. The lockfile still
  resolves thirdweb 5.121.4, but the registry proxy returned HTTP 403 while
  fetching `cosmiconfig-7.1.0.tgz`. That failed install left the local dependency
  tree incomplete, so the subsequent local type-check reports missing `next`,
  `thirdweb`, and `viem` modules and a new production build cannot be honestly
  reported from this run. The preceding onboarding commit had passed both checks
  before the environment's dependency tree was removed; this runtime fix still
  requires CI or an environment with registry access to repeat them.

### Live TCRO balance follow-up

- Live testing established that `https://cronos.org/faucet` returned 404. The
  onboarding action now opens the supplied working Cronos faucet URL,
  `https://faucet.cronos.com/`; the existing copy-address and manual-copy fallback
  are unchanged, and no address-prefill query parameter is claimed or used.
- The connected account control, desktop navbar balance group, and mobile drawer
  now show TCRO alongside USDC. They all consume `balanceLabel` from the same
  app-level `NativeGasProvider` value whose raw `balance` determines
  `hasInsufficientGas`, so the displayed amount and warning cannot query different
  addresses or data sources. Very small positive balances display as `<0.000001`
  rather than incorrectly rounding to `0`.
- The balance query key includes chain 338 and the current `useActiveAccount`
  address. It is enabled only when that address exists, always re-fetches when
  mounted after login/reconnection, gets a new query when the active address
  changes, and re-fetches on window focus or document visibility after returning
  from the faucet. These behaviors apply identically after email/Google in-app
  login and external-wallet connection because both populate the same thirdweb
  active-account hook.

### Desktop navbar follow-up

- The desktop overflow came from rendering seven navigation links, the TCRO and
  USDC balances, Get USDC, the connected address, Disconnect, and a second TCRO
  value in one non-wrapping row at the old `lg` breakpoint. The combined minimum
  width exceeded the navbar's previous `max-w-7xl` container at common laptop and
  desktop viewport sizes.
- TCRO was removed from the connected-address control, leaving one TCRO value in
  the desktop balance group (and one in the existing mobile drawer). The address
  remains cleanly truncated with its full value available as a title, while Get
  USDC and Disconnect remain direct actions.
- The full navigation now appears at Tailwind's `2xl` breakpoint, where it has a
  wider 1600px-capped container. At 1024, 1280, and 1440px the unchanged drawer
  navigation is used instead of squeezing links into the account controls; at
  1920px the complete navigation fits in one row. The body also guards against
  accidental horizontal overflow as a final layout containment measure.
