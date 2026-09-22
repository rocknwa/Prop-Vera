"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getContract,
  prepareContractCall,
  readContract,
  waitForReceipt,
} from "thirdweb";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { cronosTestnet, thirdwebClient } from "./thirdweb";

type ContractOptions = {
  address: `0x${string}`;
  abi: readonly unknown[];
  functionName: string;
  args?: readonly unknown[];
  query?: { enabled?: boolean; refetchInterval?: number };
};

function contractFor({ address, abi }: Pick<ContractOptions, "address" | "abi">) {
  return getContract({
    client: thirdwebClient,
    chain: cronosTestnet,
    address,
    abi: abi as never,
  });
}

function abiMethod(abi: readonly unknown[], functionName: string) {
  const method = abi.find(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      "type" in item &&
      "name" in item &&
      item.type === "function" &&
      item.name === functionName,
  );

  if (!method) throw new Error(`Function ${functionName} is missing from the contract ABI`);
  return method;
}

/** Compatibility-shaped hooks keep existing screens stable while thirdweb owns the account and signer. */
export function useAccount() {
  const account = useActiveAccount();
  return {
    address: account?.address as `0x${string}` | undefined,
    isConnected: Boolean(account),
  };
}

export function useReadContract(options: ContractOptions) {
  const { address, abi, functionName, args = [], query } = options;
  return useQuery<any>({
    queryKey: ["thirdweb-read", cronosTestnet.id, address, functionName, args],
    enabled: query?.enabled ?? true,
    refetchInterval: query?.refetchInterval,
    queryFn: () =>
      readContract({
        contract: contractFor(options),
        method: abiMethod(abi, functionName) as never,
        params: args as never,
      }),
  });
}

export function useWriteContract() {
  const send = useSendTransaction();

  const writeContract = (options: Omit<ContractOptions, "query">) => {
    const transaction = prepareContractCall({
      contract: contractFor(options),
      method: abiMethod(options.abi, options.functionName) as never,
      params: (options.args || []) as never,
    });
    send.mutate(transaction);
  };

  return {
    writeContract,
    data: send.data?.transactionHash as `0x${string}` | undefined,
    isPending: send.isPending,
    error: send.error,
    reset: send.reset,
  };
}

export function useWaitForTransactionReceipt({ hash }: { hash?: `0x${string}` }) {
  const receipt = useQuery({
    queryKey: ["thirdweb-receipt", cronosTestnet.id, hash],
    enabled: Boolean(hash),
    queryFn: () =>
      waitForReceipt({
        client: thirdwebClient,
        chain: cronosTestnet,
        transactionHash: hash!,
      }),
  });

  return {
    data: receipt.data,
    isLoading: receipt.isLoading,
    isSuccess: receipt.isSuccess,
    error: receipt.error,
  };
}
