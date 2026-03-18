import { useCallback } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { PROPVERA_CONTRACT_ADDRESS, PROPVERA_ABI } from "@/lib/contracts";

export function useBuyShares() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const buyShares = useCallback(
    async (assetId: string, numberOfShares: bigint, valueInWei: bigint) => {
      writeContract({
        address: PROPVERA_CONTRACT_ADDRESS as `0x${string}`,
        abi: PROPVERA_ABI,
        functionName: "buyShares",
        args: [BigInt(assetId), numberOfShares],
        value: valueInWei,
      });
    },
    [writeContract]
  );

  return {
    buyShares,
    isPending,
    isConfirming,
    isSuccess,
    transactionHash: hash,
  };
}
