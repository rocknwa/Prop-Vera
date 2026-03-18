// scripts/deploy.js
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const PVF = await ethers.getContractFactory("PropVeraFractionalToken");
  const pvf = await PVF.deploy();
  await pvf.waitForDeployment();
  console.log("PropVeraFractionalToken:", await pvf.getAddress());

  const USDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await USDC.deploy();
  await usdc.waitForDeployment();
  console.log("MockUSDC:", await usdc.getAddress());

  const PV = await ethers.getContractFactory("PropVera");
  const pv = await PV.deploy(await pvf.getAddress(), await usdc.getAddress());
  await pv.waitForDeployment();
  console.log("PropVera:", await pv.getAddress());

  await pvf.setPropVera(await pv.getAddress());
  await usdc.setMinter(await pv.getAddress(), true);
  await pv.addAdmin("0xEA05b4b861751b3e3C2BF065Ce71fc84532010Af");
  await pv.addAdmin("0xA10926725dE0075cB061ad8005F3d542FF54705e");

  console.log("Setup complete.");
}

main().catch((e) => { console.error(e); process.exit(1); });