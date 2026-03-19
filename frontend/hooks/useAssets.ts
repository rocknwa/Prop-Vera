 import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { PROPVERA_CONTRACT_ADDRESS, PROPVERA_ABI } from "@/lib/contracts"

// ─────────────────────────────────────────────────────────────────────────────
// useAssets.ts
// All function names match the deployed PropVera contract exactly.
// No fake API calls. No hardcoded data. No non-existent function names.
// ─────────────────────────────────────────────────────────────────────────────

// ── READ: single asset ────────────────────────────────────────────────────────

// getAssetDisplayInfo(uint256 tokenId)
// Returns full AssetDisplayInfo including fractional details
export function useGetAssetDisplayInfo(tokenId: bigint | undefined) {
  return useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS,
    abi: PROPVERA_ABI,
    functionName: "getAssetDisplayInfo",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: tokenId !== undefined },
  })
}

// fetchAsset(uint256 tokenId)
// Returns basic RealEstateAsset struct (price in whole USDC)
export function useFetchAsset(tokenId: bigint | undefined) {
  return useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS,
    abi: PROPVERA_ABI,
    functionName: "fetchAsset",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: tokenId !== undefined },
  })
}

// ── READ: asset lists ─────────────────────────────────────────────────────────

// fetchAllAssetsWithDisplayInfo() — all assets including sold and unverified
export function useGetAllAssetsWithDisplayInfo() {
  return useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS,
    abi: PROPVERA_ABI,
    functionName: "fetchAllAssetsWithDisplayInfo",
  })
}

// fetchAvailableAssets() — verified + unsold only (main marketplace feed)
export function useGetAvailableAssets() {
  return useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS,
    abi: PROPVERA_ABI,
    functionName: "fetchAvailableAssets",
  })
}

// fetchFractionalizedAssets() — assets with active fractional tokens
export function useGetFractionalizedAssets() {
  return useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS,
    abi: PROPVERA_ABI,
    functionName: "fetchFractionalizedAssets",
  })
}

// fetchAllListedAssets() — all assets with a non-zero seller (includes sold)
export function useGetAllListedAssets() {
  return useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS,
    abi: PROPVERA_ABI,
    functionName: "fetchAllListedAssets",
  })
}

// fetchUnsoldAssets() — all unsold assets regardless of verification status
export function useGetUnsoldAssets() {
  return useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS,
    abi: PROPVERA_ABI,
    functionName: "fetchUnsoldAssets",
  })
}

// getSellerAssets(address seller) — all assets listed by a specific seller
export function useGetSellerAssets(sellerAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS,
    abi: PROPVERA_ABI,
    functionName: "getSellerAssets",
    args: sellerAddress ? [sellerAddress] : undefined,
    query: { enabled: !!sellerAddress },
  })
}

// ── READ: purchase state ──────────────────────────────────────────────────────

// isAssetPaidFor(uint256 tokenId)
export function useIsAssetPaidFor(tokenId: bigint | undefined) {
  return useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS,
    abi: PROPVERA_ABI,
    functionName: "isAssetPaidFor",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: tokenId !== undefined },
  })
}

// getAssetBuyer(uint256 tokenId) — address of pending buyer (zero if none)
export function useGetAssetBuyer(tokenId: bigint | undefined) {
  return useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS,
    abi: PROPVERA_ABI,
    functionName: "getAssetBuyer",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: tokenId !== undefined },
  })
}

// isAssetCanceled(uint256 tokenId)
export function useIsAssetCanceled(tokenId: bigint | undefined) {
  return useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS,
    abi: PROPVERA_ABI,
    functionName: "isAssetCanceled",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: tokenId !== undefined },
  })
}

// ── READ: roles ───────────────────────────────────────────────────────────────

// sellers(address) — true if registered seller
export function useIsSeller(address: `0x${string}` | undefined) {
  return useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS,
    abi: PROPVERA_ABI,
    functionName: "sellers",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })
}

// isAdmin(address)
export function useIsAdmin(address: `0x${string}` | undefined) {
  return useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS,
    abi: PROPVERA_ABI,
    functionName: "isAdmin",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })
}

// owner()
export function useGetOwner() {
  return useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS,
    abi: PROPVERA_ABI,
    functionName: "owner",
  })
}

// getSellerMetrics(address) — returns [confirmedSales, canceledSales]
export function useGetSellerMetrics(sellerAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS,
    abi: PROPVERA_ABI,
    functionName: "getSellerMetrics",
    args: sellerAddress ? [sellerAddress] : undefined,
    query: { enabled: !!sellerAddress },
  })
}

// ── WRITE: seller registration ────────────────────────────────────────────────

export function useRegisterSeller() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const registerSeller = () => {
    writeContract({
      address: PROPVERA_CONTRACT_ADDRESS,
      abi: PROPVERA_ABI,
      functionName: "registerSeller",
    })
  }

  return { registerSeller, hash, isPending, isConfirming, isSuccess, error, reset }
}

// ── WRITE: asset lifecycle ────────────────────────────────────────────────────

// createAsset(string _tokenURI, uint256 _priceInEth)
// _priceInEth: whole USDC e.g. 1000n = 1000 USDC (contract converts to 6-dec wei internally)
// _tokenURI: base64 data URI or IPFS/HTTPS URL to JSON metadata { name, description, image }
export function useCreateAsset() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const createAsset = (tokenURI: string, priceInEth: bigint) => {
    writeContract({
      address: PROPVERA_CONTRACT_ADDRESS,
      abi: PROPVERA_ABI,
      functionName: "createAsset",
      args: [tokenURI, priceInEth],
    })
  }

  return { createAsset, hash, isPending, isConfirming, isSuccess, error, reset }
}

// verifyAsset(uint256 tokenId) — admin only
export function useVerifyAsset() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const verifyAsset = (tokenId: bigint) => {
    writeContract({
      address: PROPVERA_CONTRACT_ADDRESS,
      abi: PROPVERA_ABI,
      functionName: "verifyAsset",
      args: [tokenId],
    })
  }

  return { verifyAsset, hash, isPending, isConfirming, isSuccess, error, reset }
}

// delistAsset(uint256 tokenId) — seller only
export function useDelistAsset() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const delistAsset = (tokenId: bigint) => {
    writeContract({
      address: PROPVERA_CONTRACT_ADDRESS,
      abi: PROPVERA_ABI,
      functionName: "delistAsset",
      args: [tokenId],
    })
  }

  return { delistAsset, hash, isPending, isConfirming, isSuccess, error, reset }
}

// delistAssetAdmin(uint256 tokenId) — admin only
export function useDelistAssetAdmin() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const delistAssetAdmin = (tokenId: bigint) => {
    writeContract({
      address: PROPVERA_CONTRACT_ADDRESS,
      abi: PROPVERA_ABI,
      functionName: "delistAssetAdmin",
      args: [tokenId],
    })
  }

  return { delistAssetAdmin, hash, isPending, isConfirming, isSuccess, error, reset }
}

// ── WRITE: purchase flow ──────────────────────────────────────────────────────

// buyAsset(uint256 tokenId)
// Requires USDC approval of (asset.priceInEth * 1_000_000n) before calling
export function useBuyAsset() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const buyAsset = (tokenId: bigint) => {
    writeContract({
      address: PROPVERA_CONTRACT_ADDRESS,
      abi: PROPVERA_ABI,
      functionName: "buyAsset",
      args: [tokenId],
    })
  }

  return { buyAsset, hash, isPending, isConfirming, isSuccess, error, reset }
}

// confirmAssetPayment(uint256 tokenId) — pending buyer only
// Releases USDC to seller (97%) + platform fee (3%), transfers NFT to buyer
export function useConfirmAssetPayment() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const confirmPayment = (tokenId: bigint) => {
    writeContract({
      address: PROPVERA_CONTRACT_ADDRESS,
      abi: PROPVERA_ABI,
      functionName: "confirmAssetPayment",
      args: [tokenId],
    })
  }

  return { confirmPayment, hash, isPending, isConfirming, isSuccess, error, reset }
}

// cancelAssetPurchase(uint256 tokenId) — pending buyer only
// Refunds 99% to buyer, 1% penalty to platform
export function useCancelAssetPurchase() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const cancelPurchase = (tokenId: bigint) => {
    writeContract({
      address: PROPVERA_CONTRACT_ADDRESS,
      abi: PROPVERA_ABI,
      functionName: "cancelAssetPurchase",
      args: [tokenId],
    })
  }

  return { cancelPurchase, hash, isPending, isConfirming, isSuccess, error, reset }
}

// ── WRITE: admin management (owner only) ─────────────────────────────────────

export function useAddAdmin() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const addAdmin = (adminAddress: `0x${string}`) => {
    writeContract({
      address: PROPVERA_CONTRACT_ADDRESS,
      abi: PROPVERA_ABI,
      functionName: "addAdmin",
      args: [adminAddress],
    })
  }

  return { addAdmin, hash, isPending, isConfirming, isSuccess, error, reset }
}

export function useRemoveAdmin() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const removeAdmin = (adminAddress: `0x${string}`) => {
    writeContract({
      address: PROPVERA_CONTRACT_ADDRESS,
      abi: PROPVERA_ABI,
      functionName: "removeAdmin",
      args: [adminAddress],
    })
  }

  return { removeAdmin, hash, isPending, isConfirming, isSuccess, error, reset }
}

// withdrawUSDC(address recipient, uint256 amountInEth) — owner only
// amountInEth: whole USDC e.g. 500n = 500 USDC
export function useWithdrawUSDC() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const withdrawUSDC = (recipient: `0x${string}`, amountInEth: bigint) => {
    writeContract({
      address: PROPVERA_CONTRACT_ADDRESS,
      abi: PROPVERA_ABI,
      functionName: "withdrawUSDC",
      args: [recipient, amountInEth],
    })
  }

  return { withdrawUSDC, hash, isPending, isConfirming, isSuccess, error, reset }
}
