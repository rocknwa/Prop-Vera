const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("PropVeraModule", (m) => {
  // Deploy PropVeraFractionalToken contract
  const propVeraFractionalToken = m.contract("PropVeraFractionalToken", []);

  // Deploy MockUSDC contract
  const mockUSDC = m.contract("MockUSDC", []);

  const admin1 = "0xAD18041B8Cd45A154224020228300ACa918C3F35";
  const admin2 = "0x28b7D4ee5c1B48A34ec784D336fbC4f965c02137";

  // Deploy PropVera contract with the address of PropVeraFractionalToken contract
  const propVera = m.contract("PropVera", [propVeraFractionalToken, mockUSDC]);

  // Set the PropVera address in the PropVeraFractionalToken contract
  m.call(propVeraFractionalToken, "setPropVera", [propVera]);

  // Add admins with unique IDs
  m.call(propVera, "addAdmin", [admin1], { id: "AddAdmin1" });
  m.call(propVera, "addAdmin", [admin2], { id: "AddAdmin2" });

  return { propVeraFractionalToken, mockUSDC, propVera };
});