// scripts/deployFaucet.js
// Run AFTER the main deploy script.
// Deploys USDCFaucet, whitelists it as a minter on MockUSDC.
//
// Usage:
//   npx hardhat run scripts/deployFaucet.js --network polkadotTestnet

const { ethers } = require("hardhat");

// ── CONFIG ────────────────────────────────────────────────────────────────────
// Paste your already-deployed MockUSDC address here:
const MOCK_USDC_ADDRESS = "0xAdf4d9B286D4c757d5aAce5EE544318F895A0E06";

// Drip amount in whole USDC (10,000 USDC per drip)
const DRIP_AMOUNT = 10_000n;

// Cooldown in seconds — set to 0 for testnet (no waiting)
const COOLDOWN_SECONDS = 0n;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying USDCFaucet with:", deployer.address);

  // 1. Deploy faucet
  const Faucet = await ethers.getContractFactory("USDCFaucet");
  const faucet = await Faucet.deploy(MOCK_USDC_ADDRESS);
  await faucet.waitForDeployment();
  const faucetAddress = await faucet.getAddress();
  console.log("USDCFaucet deployed to:", faucetAddress);

  // 2. Set cooldown to 0 for testnet (users can drip any time)
  if (COOLDOWN_SECONDS === 0n) {
    await faucet.setCooldown(0n);
    console.log("Cooldown set to 0 (testnet mode — no waiting)");
  }

  // 3. Set drip amount
  await faucet.setDripAmount(DRIP_AMOUNT);
  console.log(`Drip amount set to ${DRIP_AMOUNT} USDC per call`);

  // 4. Whitelist faucet as a minter on MockUSDC
  const usdc = await ethers.getContractAt("MockUSDC", MOCK_USDC_ADDRESS);
  await usdc.setMinter(faucetAddress, true);
  console.log("Faucet whitelisted as minter on MockUSDC ✓");

  console.log("\n──────────────────────────────────────────");
  console.log("USDCFaucet address:", faucetAddress);
  console.log("Add this to your .env.local and Vercel:");
  console.log(`NEXT_PUBLIC_FAUCET_ADDRESS=${faucetAddress}`);
  console.log("──────────────────────────────────────────\n");
}

main().catch((e) => { console.error(e); process.exit(1); });