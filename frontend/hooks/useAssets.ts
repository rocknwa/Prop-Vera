import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { PROPVERA_CONTRACT_ADDRESS, PROPVERA_ABI } from "@/lib/contracts"

// ─── READ HOOKS ──────────────────────────────────────────────────────────────

export function useGetAssetDisplayInfo(tokenId: bigint | undefined) {
  return useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS,
    abi: PROPVERA_ABI,
    functionName: "getAssetDisplayInfo",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: tokenId !== undefined },
  })
}

export function useGetAllAssetsWithDisplayInfo() {
  return useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS,
    abi: PROPVERA_ABI,
    functionName: "fetchAllAssetsWithDisplayInfo",
  })
}

export function useGetAvailableAssets() {
  return useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS,
    abi: PROPVERA_ABI,
    functionName: "fetchAvailableAssets",
  })
}

export function useGetFractionalizedAssets() {
  return useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS,
    abi: PROPVERA_ABI,
    functionName: "fetchFractionalizedAssets",
  })
}

export function useGetAllListedAssets() {
  return useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS,
    abi: PROPVERA_ABI,
    functionName: "fetchAllListedAssets",
  })
}

export function useGetUnsoldAssets() {
  return useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS,
    abi: PROPVERA_ABI,
    functionName: "fetchUnsoldAssets",
  })
}

export function useGetSellerAssets(sellerAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS,
    abi: PROPVERA_ABI,
    functionName: "getSellerAssets",
    args: sellerAddress ? [sellerAddress] : undefined,
    query: { enabled: !!sellerAddress },
  })
}

export function useGetSellerMetrics(sellerAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS,
    abi: PROPVERA_ABI,
    functionName: "getSellerMetrics",
    args: sellerAddress ? [sellerAddress] : undefined,
    query: { enabled: !!sellerAddress },
  })
}

export function useIsAssetPaidFor(tokenId: bigint | undefined) {
  return useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS,
    abi: PROPVERA_ABI,
    functionName: "isAssetPaidFor",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: tokenId !== undefined },
  })
}

export function useGetAssetBuyer(tokenId: bigint | undefined) {
  return useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS,
    abi: PROPVERA_ABI,
    functionName: "getAssetBuyer",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: tokenId !== undefined },
  })
}

export function useIsAssetCanceled(tokenId: bigint | undefined) {
  return useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS,
    abi: PROPVERA_ABI,
    functionName: "isAssetCanceled",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: tokenId !== undefined },
  })
}

export function useIsSeller(address: `0x${string}` | undefined) {
  return useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS,
    abi: PROPVERA_ABI,
    functionName: "sellers",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })
}

export function useIsAdmin(address: `0x${string}` | undefined) {
  return useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS,
    abi: PROPVERA_ABI,
    functionName: "isAdmin",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })
}

export function useGetOwner() {
  return useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS,
    abi: PROPVERA_ABI,
    functionName: "owner",
  })
}

// ─── WRITE HOOKS ─────────────────────────────────────────────────────────────

// registerSeller()
export function useRegisterSeller() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const registerSeller = () => {
    writeContract({
      address: PROPVERA_CONTRACT_ADDRESS,
      abi: PROPVERA_ABI,
      functionName: "registerSeller",
    })
  }

  return { registerSeller, hash, isPending, isConfirming, isSuccess, error }
}

// createAsset(string _tokenURI, uint256 _priceInEth)
// _priceInEth is whole USDC units e.g. 1000n = 1000 USDC
export function useCreateAsset() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const createAsset = (tokenURI: string, priceInEth: bigint) => {
    writeContract({
      address: PROPVERA_CONTRACT_ADDRESS,
      abi: PROPVERA_ABI,
      functionName: "createAsset",
      args: [tokenURI, priceInEth],
    })
  }

  return { createAsset, hash, isPending, isConfirming, isSuccess, error }
}

// verifyAsset(uint256 tokenId) — admin only
export function useVerifyAsset() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const verifyAsset = (tokenId: bigint) => {
    writeContract({
      address: PROPVERA_CONTRACT_ADDRESS,
      abi: PROPVERA_ABI,
      functionName: "verifyAsset",
      args: [tokenId],
    })
  }

  return { verifyAsset, hash, isPending, isConfirming, isSuccess, error }
}

// delistAsset(uint256 tokenId) — seller only
export function useDelistAsset() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const delistAsset = (tokenId: bigint) => {
    writeContract({
      address: PROPVERA_CONTRACT_ADDRESS,
      abi: PROPVERA_ABI,
      functionName: "delistAsset",
      args: [tokenId],
    })
  }

  return { delistAsset, hash, isPending, isConfirming, isSuccess, error }
}

// delistAssetAdmin(uint256 tokenId) — admin only
export function useDelistAssetAdmin() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const delistAssetAdmin = (tokenId: bigint) => {
    writeContract({
      address: PROPVERA_CONTRACT_ADDRESS,
      abi: PROPVERA_ABI,
      functionName: "delistAssetAdmin",
      args: [tokenId],
    })
  }

  return { delistAssetAdmin, hash, isPending, isConfirming, isSuccess, error }
}

// buyAsset(uint256 tokenId)
// Requires USDC approval of priceInEth * 1_000_000n before calling
export function useBuyAsset() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const buyAsset = (tokenId: bigint) => {
    writeContract({
      address: PROPVERA_CONTRACT_ADDRESS,
      abi: PROPVERA_ABI,
      functionName: "buyAsset",
      args: [tokenId],
    })
  }

  return { buyAsset, hash, isPending, isConfirming, isSuccess, error }
}

// confirmAssetPayment(uint256 tokenId) — buyer only
export function useConfirmAssetPayment() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const confirmPayment = (tokenId: bigint) => {
    writeContract({
      address: PROPVERA_CONTRACT_ADDRESS,
      abi: PROPVERA_ABI,
      functionName: "confirmAssetPayment",
      args: [tokenId],
    })
  }

  return { confirmPayment, hash, isPending, isConfirming, isSuccess, error }
}

// cancelAssetPurchase(uint256 tokenId) — buyer only, 1% penalty
export function useCancelAssetPurchase() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const cancelPurchase = (tokenId: bigint) => {
    writeContract({
      address: PROPVERA_CONTRACT_ADDRESS,
      abi: PROPVERA_ABI,
      functionName: "cancelAssetPurchase",
      args: [tokenId],
    })
  }

  return { cancelPurchase, hash, isPending, isConfirming, isSuccess, error }
}

// addAdmin(address _admin) — owner only
export function useAddAdmin() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const addAdmin = (adminAddress: `0x${string}`) => {
    writeContract({
      address: PROPVERA_CONTRACT_ADDRESS,
      abi: PROPVERA_ABI,
      functionName: "addAdmin",
      args: [adminAddress],
    })
  }

  return { addAdmin, hash, isPending, isConfirming, isSuccess, error }
}

// removeAdmin(address _admin) — owner only
export function useRemoveAdmin() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const removeAdmin = (adminAddress: `0x${string}`) => {
    writeContract({
      address: PROPVERA_CONTRACT_ADDRESS,
      abi: PROPVERA_ABI,
      functionName: "removeAdmin",
      args: [adminAddress],
    })
  }

  return { removeAdmin, hash, isPending, isConfirming, isSuccess, error }
}

// withdrawUSDC(address recipient, uint256 amountInEth) — owner only
export function useWithdrawUSDC() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const withdrawUSDC = (recipient: `0x${string}`, amountInEth: bigint) => {
    writeContract({
      address: PROPVERA_CONTRACT_ADDRESS,
      abi: PROPVERA_ABI,
      functionName: "withdrawUSDC",
      args: [recipient, amountInEth],
    })
  }

  return { withdrawUSDC, hash, isPending, isConfirming, isSuccess, error }
}
