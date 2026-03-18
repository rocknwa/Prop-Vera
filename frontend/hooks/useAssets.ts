import { useCallback } from "react";
import { useReadContract, useWriteContract } from "wagmi";
import { Asset } from "@/lib/types";
import { PROPVERA_CONTRACT_ADDRESS, PROPVERA_ABI } from "@/lib/contracts";

export function useGetAsset(assetId: string) {
  const { data, isLoading, error } = useReadContract({
    address: PROPVERA_CONTRACT_ADDRESS as `0x${string}`,
    abi: PROPVERA_ABI,
    functionName: "getAssetDetails",
    args: [BigInt(assetId)],
  });

  return { asset: data, isLoading, error };
}

export function useGetAllAssets() {
  // This would typically fetch from an API or contract
  // For now returning void as it needs to be implemented
  const getAssets = useCallback(async () => {
    try {
      // TODO: Implement contract call or API fetch
      const response = await fetch("/api/assets");
      return await response.json();
    } catch (error) {
      console.error("Error fetching assets:", error);
      return [];
    }
  }, []);

  return { getAssets };
}

export function useCreateAsset() {
  const { writeContract, isPending } = useWriteContract();

  const createAsset = useCallback(
    (
      assetType: string,
      totalShares: bigint,
      pricePerShare: bigint
    ) => {
      writeContract({
        address: PROPVERA_CONTRACT_ADDRESS as `0x${string}`,
        abi: PROPVERA_ABI,
        functionName: "createAsset",
        args: [assetType, totalShares, pricePerShare],
      });
    },
    [writeContract]
  );

  return { createAsset, isLoading: isPending };
}
