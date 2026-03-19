// PropVera Smart Contract ABIs and addresses
import { PROPVERA_ABI } from "./abis/propvera";
import { MOCKUSDC_ABI } from "./abis/mockusdc";
import { FRACTIONAL_TOKEN_ABI } from "./abis/fractional";

// Contract Addresses
export const PROPVERA_ADDRESS =
  (process.env.NEXT_PUBLIC_PROPVERA_ADDRESS as `0x${string}`) ||
  "0xdF6A1Da673B623D9e1c6c538f4653d4429284429";

export const MOCKUSDC_ADDRESS =
  (process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`) ||
  "0xAdf4d9B286D4c757d5aAce5EE544318F895A0E06";

export const FRACTIONAL_TOKEN_ADDRESS =
  (process.env.NEXT_PUBLIC_FRACTIONAL_TOKEN_ADDRESS as `0x${string}`) ||
  "0x1807F7c4984f5188e948C2e828fadE1b2F0011eb";

export const CHAIN_ID = 420420417;

// Re-export ABIs
export { PROPVERA_ABI, MOCKUSDC_ABI, FRACTIONAL_TOKEN_ABI };

// Error message mapping for contract reverts
export const CONTRACT_ERROR_MESSAGES: Record<string, string> = {
  SellerAlreadyRegistered: "You are already registered as a seller",
  AssetAlreadySold: "This asset has already been sold",
  InsufficientTokens: "Not enough fractional tokens available",
  NotAdmin: "You do not have admin privileges",
  ContractNotApproved: "Please approve the contract to spend your tokens first",
  InsufficientUSDCBalance: "Insufficient USDC balance",
  CannotWithdrawYet: "Withdrawals are not enabled for this asset yet",
  NotOwner: "You are not the owner of this contract",
  InvalidTokenId: "Invalid or non-existent token ID",
  NotSeller: "You are not the seller of this asset",
  NotBuyer: "You are not the buyer of this asset",
  AssetNotFractionalized: "This asset is not fractionalized",
  ListingNotActive: "This listing is no longer active",
};

// Parse error message from contract revert
export function parseContractError(error: unknown): string {
  if (typeof error === "string") {
    // Try to match error names
    for (const [errorName, message] of Object.entries(CONTRACT_ERROR_MESSAGES)) {
      if (error.includes(errorName)) {
        return message;
      }
    }
    // Return raw error if no match
    return error;
  }

  if (error instanceof Error) {
    const message = error.message;
    for (const [errorName, msg] of Object.entries(CONTRACT_ERROR_MESSAGES)) {
      if (message.includes(errorName)) {
        return msg;
      }
    }
    return message;
  }

  return "An unknown error occurred";
}
