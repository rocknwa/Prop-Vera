import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { useAccount } from "wagmi"
import {
  PROPVERA_CONTRACT_ADDRESS,
  PROPVERA_ABI,
  MOCK_USDC_ADDRESS,
  MOCK_USDC_ABI,
  PROPVERA_FRACTIONAL_TOKEN_ADDRESS,
  PROPVERA_FRACTIONAL_TOKEN_ABI,
} from "@/lib/contracts"
import { parseEther } from "viem"

// ─────────────────────────────────────────────────────────────────────────────
// useBuyShares
//
// Replaces the broken hook that called non-existent "buyShares" and incorrectly
// passed a `value` (ETH). PropVera is USDC-only — no ETH is ever sent.
//
// The contract has TWO share-buying flows:
//   1. buyFractionalAsset(tokenId, numTokensInEth)  — primary market
//   2. buyListedShares(listingId)                   — secondary market
//
// Both require a USDC approve() call BEFORE the buy call.
// ─────────────────────────────────────────────────────────────────────────────

// ── USDC Approval ─────────────────────────────────────────────────────────────

export function useApproveUSDC() {
  const {
    writeContract,
    data: hash,
    isPending,
    error,
    reset,
  } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // wholeUsdcAmount: human-readable USDC e.g. 1000n = 1000 USDC
  // Internally multiplied by 1_000_000n to get 6-decimal wei
  const approveUSDC = (spender: `0x${string}`, wholeUsdcAmount: bigint) => {
    writeContract({
      address: MOCK_USDC_ADDRESS,
      abi: MOCK_USDC_ABI,
      functionName: "approve",
      args: [spender, wholeUsdcAmount * 1_000_000n],
    })
  }

  return { approveUSDC, hash, isPending, isConfirming, isSuccess, error, reset }
}

// ── Check USDC Allowance ──────────────────────────────────────────────────────

export function useUSDCAllowance(
  ownerAddress: `0x${string}` | undefined,
  spenderAddress: `0x${string}` | undefined
) {
  return useReadContract({
    address: MOCK_USDC_ADDRESS,
    abi: MOCK_USDC_ABI,
    functionName: "allowance",
    args:
      ownerAddress && spenderAddress
        ? [ownerAddress, spenderAddress]
        : undefined,
    query: { enabled: !!ownerAddress && !!spenderAddress },
  })
}

// ── Buy Fractional Shares — Primary Market ────────────────────────────────────
//
// buyFractionalAsset(uint256 tokenId, uint256 numTokensInEth)
//   tokenId:       the NFT asset ID
//   numTokensInEth: whole PVF token count e.g. 10n = 10 PVF tokens
//
// Before calling: approve USDC of (numTokens * pricePerToken * 1_000_000n)
// No ETH value — payment is in USDC only

export function useBuyFractionalAsset() {
  const {
    writeContract,
    data: hash,
    isPending,
    error,
    reset,
  } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const buyFractionalAsset = (tokenId: bigint, numTokensInEth: bigint) => {
    writeContract({
      address: PROPVERA_CONTRACT_ADDRESS,
      abi: PROPVERA_ABI,
      functionName: "buyFractionalAsset",
      args: [tokenId, numTokensInEth],
      // NO `value` field — this is NOT a payable function
    })
  }

  return {
    buyFractionalAsset,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  }
}

// ── Buy Listed Shares — Secondary Market ─────────────────────────────────────
//
// buyListedShares(uint256 listingId)
//   listingId: the ID from shareListings mapping
//
// Before calling: approve USDC of (listing.numShares * listing.pricePerShare * 1_000_000n)
// No ETH value — payment is in USDC only

export function useBuyListedShares() {
  const {
    writeContract,
    data: hash,
    isPending,
    error,
    reset,
  } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const buyListedShares = (listingId: bigint) => {
    writeContract({
      address: PROPVERA_CONTRACT_ADDRESS,
      abi: PROPVERA_ABI,
      functionName: "buyListedShares",
      args: [listingId],
      // NO `value` field — this is NOT a payable function
    })
  }

  return {
    buyListedShares,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  }
}

// ── List Shares for Sale ──────────────────────────────────────────────────────
//
// listSharesForSale(uint256 tokenId, uint256 numSharesInEth, uint256 pricePerShareInEth)
//   numSharesInEth:     whole PVF count  e.g. 5n = 5 PVF
//   pricePerShareInEth: whole USDC price e.g. 12n = 12 USDC per share
//
// Before calling: approve PVF of parseEther(numShares.toString())

export function useListSharesForSale() {
  const {
    writeContract,
    data: hash,
    isPending,
    error,
    reset,
  } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const listSharesForSale = (
    tokenId: bigint,
    numSharesInEth: bigint,
    pricePerShareInEth: bigint
  ) => {
    writeContract({
      address: PROPVERA_CONTRACT_ADDRESS,
      abi: PROPVERA_ABI,
      functionName: "listSharesForSale",
      args: [tokenId, numSharesInEth, pricePerShareInEth],
    })
  }

  return {
    listSharesForSale,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  }
}

// ── Cancel Share Listing ──────────────────────────────────────────────────────
//
// cancelShareListing(uint256 listingId) — listing seller only
// Returns escrowed PVF shares back to the seller

export function useCancelShareListing() {
  const {
    writeContract,
    data: hash,
    isPending,
    error,
    reset,
  } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const cancelShareListing = (listingId: bigint) => {
    writeContract({
      address: PROPVERA_CONTRACT_ADDRESS,
      abi: PROPVERA_ABI,
      functionName: "cancelShareListing",
      args: [listingId],
    })
  }

  return {
    cancelShareListing,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  }
}

// ── Transfer Shares (peer-to-peer, no fee) ────────────────────────────────────
//
// transferShares(uint256 tokenId, address to, uint256 numSharesInEth)
//   numSharesInEth: whole PVF count e.g. 5n
//
// Before calling: approve PVF of parseEther(numShares.toString())

export function useTransferShares() {
  const {
    writeContract,
    data: hash,
    isPending,
    error,
    reset,
  } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const transferShares = (
    tokenId: bigint,
    to: `0x${string}`,
    numSharesInEth: bigint
  ) => {
    writeContract({
      address: PROPVERA_CONTRACT_ADDRESS,
      abi: PROPVERA_ABI,
      functionName: "transferShares",
      args: [tokenId, to, numSharesInEth],
    })
  }

  return {
    transferShares,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  }
}

// ── Approve PVF ───────────────────────────────────────────────────────────────
//
// Required before: transferShares, listSharesForSale, cancelFractionalAssetPurchase
// numSharesInEth: whole PVF count — converted to 1e18 wei via parseEther

export function useApprovePVF() {
  const {
    writeContract,
    data: hash,
    isPending,
    error,
    reset,
  } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const approvePVF = (spender: `0x${string}`, numSharesInEth: bigint) => {
    writeContract({
      address: PROPVERA_FRACTIONAL_TOKEN_ADDRESS,
      abi: PROPVERA_FRACTIONAL_TOKEN_ABI,
      functionName: "approve",
      args: [spender, parseEther(numSharesInEth.toString())],
    })
  }

  return { approvePVF, hash, isPending, isConfirming, isSuccess, error, reset }
}

// ── Mint Test USDC ────────────────────────────────────────────────────────────
//
// MockUSDC.mint(address to, uint256 amountInEth)
// amountInEth is whole USDC e.g. 10000n = 10,000 USDC
// The contract multiplies by 1e6 internally — do NOT pre-multiply here

export function useMintUSDC() {
  const {
    writeContract,
    data: hash,
    isPending,
    error,
    reset,
  } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const mintUSDC = (to: `0x${string}`, wholeAmount: bigint = 10_000n) => {
    writeContract({
      address: MOCK_USDC_ADDRESS,
      abi: MOCK_USDC_ABI,
      functionName: "mint",
      args: [to, wholeAmount],
    })
  }

  return { mintUSDC, hash, isPending, isConfirming, isSuccess, error, reset }
}
