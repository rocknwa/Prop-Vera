import { useCallback } from "react";
import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { STAKING_ABI } from "@/lib/contracts";

const STAKING_ADDRESS = process.env.NEXT_PUBLIC_STAKING_ADDRESS || "";

export function useStaking() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const stake = useCallback(
    (amount: bigint) => {
      writeContract({
        address: STAKING_ADDRESS as `0x${string}`,
        abi: STAKING_ABI,
        functionName: "stake",
        args: [amount],
      });
    },
    [writeContract]
  );

  const unstake = useCallback(
    (amount: bigint) => {
      writeContract({
        address: STAKING_ADDRESS as `0x${string}`,
        abi: STAKING_ABI,
        functionName: "unstake",
        args: [amount],
      });
    },
    [writeContract]
  );

  const claimRewards = useCallback(() => {
    writeContract({
      address: STAKING_ADDRESS as `0x${string}`,
      abi: STAKING_ABI,
      functionName: "claimRewards",
      args: [],
    });
  }, [writeContract]);

  return {
    stake,
    unstake,
    claimRewards,
    isPending,
    isConfirming,
    isSuccess,
    transactionHash: hash,
  };
}

export function useStakingBalance(address?: `0x${string}`) {
  const { data: balance, isLoading } = useReadContract({
    address: STAKING_ADDRESS as `0x${string}`,
    abi: STAKING_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return { balance: balance as bigint | undefined, isLoading };
}
