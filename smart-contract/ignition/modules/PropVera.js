const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("PropVeraModule", (m) => {
  // ── Token contracts ─────────────────────────────────────────────────────────
  const propVeraFractionalToken = m.contract("PropVeraFractionalToken", []);
  const mockUSDC = m.contract("MockUSDC", []);

  // ── Core protocol ───────────────────────────────────────────────────────────
  const propVera = m.contract("PropVera", [propVeraFractionalToken, mockUSDC]);

  // ── Post-deploy wiring ──────────────────────────────────────────────────────
  // Lock the PropVera address into the fractional token (one-time, irreversible)
  m.call(propVeraFractionalToken, "setPropVera", [propVera], {
    id: "SetPropVeraAddress",
  });

  // Authorise MockUSDC to mint (deployer is minter by default; grant PropVera too)
  m.call(mockUSDC, "setMinter", [propVera, true], {
    id: "GrantPropVeraMinter",
  });

  // ── Admins ──────────────────────────────────────────────────────────────────
  const admin1 = "0xEA05b4b861751b3e3C2BF065Ce71fc84532010Af";
  const admin2 = "0xA10926725dE0075cB061ad8005F3d542FF54705e";

  m.call(propVera, "addAdmin", [admin1], { id: "AddAdmin1" });
  m.call(propVera, "addAdmin", [admin2], { id: "AddAdmin2" });

  // ── Exports ─────────────────────────────────────────────────────────────────
  return { propVeraFractionalToken, mockUSDC, propVera };
});