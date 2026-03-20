import { useReadContract } from "wagmi"
import { useAccount } from "wagmi"
import {
  PROPVERA_CONTRACT_ADDRESS,
  PROPVERA_ABI,
  PROPVERA_FRACTIONAL_TOKEN_ADDRESS,
  PROPVERA_FRACTIONAL_TOKEN_ABI,
  MOCK_USDC_ADDRESS,
  MOCK_USDC_ABI,
} from "@/lib/contracts"

// ─────────────────────────────────────────────────────────────────────────────
// useUserProfile
// Replaces the broken fake /api/users/${address} fetch with real on-chain reads.
// All data comes directly from the deployed contracts.
// ─────────────────────────────────────────────────────────────────────────────

export function useUserProfile() {
  const { address, isConnected } = useAccount()

  // ── Role checks ────────────────────────────────────────────────────────────

  const { data: isSeller, isLoading: isSellerLoading } = useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS,
    abi: PROPVERA_ABI,
    functionName: "sellers",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const { data: isAdmin, isLoading: isAdminLoading } = useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS,
    abi: PROPVERA_ABI,
    functionName: "isAdmin",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const { data: owner, isLoading: isOwnerLoading } = useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS,
    abi: PROPVERA_ABI,
    functionName: "owner",
    query: { enabled: !!address },
  })

  // ── Token balances ─────────────────────────────────────────────────────────

  const { data: usdcBalance, isLoading: isUsdcLoading, refetch: refetchUSDC } = useReadContract({
    address: MOCK_USDC_ADDRESS,
    abi: MOCK_USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10_000 },
  })

  const { data: pvfBalance, isLoading: isPvfLoading, refetch: refetchPVF } = useReadContract({
    address: PROPVERA_FRACTIONAL_TOKEN_ADDRESS,
    abi: PROPVERA_FRACTIONAL_TOKEN_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10_000 },
  })

  // ── Seller metrics (confirmed sales, canceled sales) ──────────────────────

  const { data: sellerMetrics, isLoading: isMetricsLoading } = useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS,
    abi: PROPVERA_ABI,
    functionName: "getSellerMetrics",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!isSeller },
  })

  // ── Fractional portfolio ───────────────────────────────────────────────────

  const { data: portfolio, isLoading: isPortfolioLoading } = useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS,
    abi: PROPVERA_ABI,
    functionName: "getBuyerPortfolio",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  // ── Seller's listed assets ─────────────────────────────────────────────────

  const { data: sellerAssets, isLoading: isSellerAssetsLoading } = useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS,
    abi: PROPVERA_ABI,
    functionName: "getSellerAssets",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!isSeller },
  })

  // ── Derived values ─────────────────────────────────────────────────────────

  // USDC balance in whole units (6 decimals): raw / 1_000_000
  const usdcBalanceFormatted =
    usdcBalance !== undefined
      ? (Number(usdcBalance) / 1_000_000).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "0.00"

  // PVF balance in whole units (18 decimals): raw / 1e18
  const pvfBalanceFormatted =
    pvfBalance !== undefined
      ? (Number(pvfBalance) / 1e18).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 4,
        })
      : "0.00"

  // Total invested across all fractional positions (sum of investmentValueInEth)
  // investmentValueInEth is already in whole USDC units from the contract
  const totalInvested =
    portfolio && portfolio.length > 0
      ? portfolio.reduce(
          (sum, item) => sum + Number(item.investmentValueInEth),
          0
        )
      : 0

  // Seller confirmed / canceled counts
  // getSellerMetrics returns [confirmedCount, canceledCount]
  const confirmedSales = sellerMetrics ? Number(sellerMetrics[0]) : 0
  const canceledSales = sellerMetrics ? Number(sellerMetrics[1]) : 0

  const isOwner =
    address && owner
      ? address.toLowerCase() === (owner as string).toLowerCase()
      : false

  const isLoading =
    isSellerLoading ||
    isAdminLoading ||
    isOwnerLoading ||
    isUsdcLoading ||
    isPvfLoading ||
    isMetricsLoading ||
    isPortfolioLoading ||
    isSellerAssetsLoading

  return {
    // Wallet
    address,
    isConnected,

    // Roles
    isSeller: !!isSeller,
    isAdmin: !!isAdmin,
    isOwner,

    // Balances (raw bigint)
    usdcBalance: usdcBalance ?? 0n,
    pvfBalance: pvfBalance ?? 0n,

    // Balances (formatted string for display)
    usdcBalanceFormatted,
    pvfBalanceFormatted,

    // Seller data
    confirmedSales,
    canceledSales,
    sellerAssets: sellerAssets ?? [],

    // Buyer/investor data
    // ownershipPercentage in each portfolio item is scaled by 1e18
    // Display as: (Number(item.ownershipPercentage) / 1e18).toFixed(2) + "%"
    portfolio: portfolio ?? [],
    totalInvested,

    // Refetch helpers
    refetchUSDC,
    refetchPVF,

    isLoading,
  }
}
