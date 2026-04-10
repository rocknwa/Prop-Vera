// ignition/modules/deploy.js
const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("PropVeraFullDeployment", (m) => {
  // ── CONFIG ─────────────────────────────────────────────────────────────────
  const DRIP_AMOUNT = 10_000n;          // 10,000 whole USDC per drip
  const COOLDOWN_SECONDS = 0n;          // 0 = testnet mode (no cooldown)

  const ADMIN_1 = "0xEA05b4b861751b3e3C2BF065Ce71fc84532010Af";
  const ADMIN_2 = "0xA10926725dE0075cB061ad8005F3d542FF54705e";

  // ── DEPLOYMENTS ────────────────────────────────────────────────────────────
  const pvf = m.contract("PropVeraFractionalToken");
  const usdc = m.contract("MockUSDC");
  const pv = m.contract("PropVera", [pvf, usdc]);
  const faucet = m.contract("USDCFaucet", [usdc]);

  // ── POST-DEPLOYMENT SETUP ──────────────────────────────────────────────────
  m.call(pvf, "setPropVera", [pv]);

  // Unique ID for first setMinter (PropVera)
  m.call(usdc, "setMinter", [pv, true], { id: "setMinterForPropVera" });

  // Unique IDs for the two addAdmin calls
  m.call(pv, "addAdmin", [ADMIN_1], { id: "addAdmin1" });
  m.call(pv, "addAdmin", [ADMIN_2], { id: "addAdmin2" });

  // ── FAUCET CONFIGURATION ───────────────────────────────────────────────────
  m.call(faucet, "setCooldown", [COOLDOWN_SECONDS]);
  m.call(faucet, "setDripAmount", [DRIP_AMOUNT]);

  // Unique ID for second setMinter (faucet)
  m.call(usdc, "setMinter", [faucet, true], { id: "setMinterForFaucet" });

  // ── RETURN CONTRACTS ───────────────────────────────────────────────────────
  return {
    pvf,
    usdc,
    pv,
    faucet,
  };
});