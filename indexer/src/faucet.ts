import { BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Dripped } from "../generated/USDCFaucet/USDCFaucet";
import { FaucetDrip } from "../generated/schema";

export function handleDripped(event: Dripped): void {
  const faucetDrip = new FaucetDrip(generateFaucetDripId(event));
  faucetDrip.recipient = event.params.recipient;
  faucetDrip.amount = event.params.amountInEth;
  faucetDrip.timestamp = event.block.timestamp;
  faucetDrip.save();
}

function generateFaucetDripId(event: ethereum.Event): string {
  return event.transaction.hash.toHex() + "-" + event.logIndex.toString();
}