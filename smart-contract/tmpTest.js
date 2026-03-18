const { ethers } = require('hardhat');

(async () => {
    const [owner, seller, buyer, other] = await ethers.getSigners();
    const MockUSDC = await ethers.getContractFactory('MockUSDC', owner);
    const usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();

    const PropVeraFractionalToken = await ethers.getContractFactory('PropVeraFractionalToken', owner);
    const token = await PropVeraFractionalToken.deploy();
    await token.waitForDeployment();

    console.log('Deployer:', owner.address);
    console.log('Token owner:', await token.owner());

    const PropVera = await ethers.getContractFactory('PropVera', owner);
    const propVera = await PropVera.deploy(token.target, usdc.target);
    await propVera.waitForDeployment();

    await token.setPropVera(propVera.target);
    console.log('Set propVera ok');

    try {
        await token.setPropVera(other.address);
    } catch (e) {
        console.log('owner retry error:', e.errorName || e.reason || e.message);
    }

    try {
        await token.connect(other).setPropVera(other.address);
    } catch (e) {
        console.log('other error:', e.errorName || e.reason || e.message);
    }

    try {
        await usdc.connect(other).setMinter(other.address, true);
    } catch (e) {
        console.log('setMinter non-owner error:', e.errorName || e.reason || e.message);
    }
})();
