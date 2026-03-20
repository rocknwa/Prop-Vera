// PropVera Smart Contract ABIs and addresses
import { PROPVERA_ABI } from "./abis/propvera";
import { MOCKUSDC_ABI } from "./abis/mockusdc";
import { FRACTIONAL_TOKEN_ABI } from "./abis/fractional";
import { USDC_FAUCET_ABI } from "./abis/faucet";

// Contract Addresses - exported with exact names for imports
export const PROPVERA_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_PROPVERA_ADDRESS as `0x${string}`;
export const PROPVERA_FRACTIONAL_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_FRACTIONAL_TOKEN_ADDRESS as `0x${string}`;
export const MOCK_USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`;
export const USDC_FAUCET_ADDRESS = process.env.NEXT_PUBLIC_FAUCET_ADDRESS as `0x${string}`;
export const CHAIN_ID = 420420417;

// Re-export ABIs with proper names
export { PROPVERA_ABI };
export { MOCKUSDC_ABI as MOCK_USDC_ABI };
export { FRACTIONAL_TOKEN_ABI as PROPVERA_FRACTIONAL_TOKEN_ABI };
export { USDC_FAUCET_ABI };

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
  CooldownNotElapsed: "Please wait before requesting more USDC",
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