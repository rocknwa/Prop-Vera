const { loadFixture, time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

// ─────────────────────────────────────────────────────────────────────────────
// USDCFaucet.test.js
// Full test suite — every function, branch, event, and custom error covered.
// ─────────────────────────────────────────────────────────────────────────────

describe("USDCFaucet", function () {

  // ── Shared fixture ──────────────────────────────────────────────────────────
  async function deployFaucetFixture() {
    const [owner, user1, user2, stranger] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();

    // Deploy faucet
    const USDCFaucet = await ethers.getContractFactory("USDCFaucet");
    const faucet = await USDCFaucet.deploy(await usdc.getAddress());

    // Whitelist faucet as a minter on MockUSDC
    await usdc.setMinter(await faucet.getAddress(), true);

    // Default faucet values
    const DEFAULT_DRIP_AMOUNT = 10_000n;   // whole USDC
    const DEFAULT_COOLDOWN    = 86_400n;   // 24 hours in seconds
    const USDC_UNIT           = 1_000_000n; // 6 decimals

    return { faucet, usdc, owner, user1, user2, stranger, DEFAULT_DRIP_AMOUNT, DEFAULT_COOLDOWN, USDC_UNIT };
  }

  // ── Fixture with cooldown = 0 (testnet mode) ────────────────────────────────
  async function deployFaucetNoCooldownFixture() {
    const base = await deployFaucetFixture();
    await base.faucet.setCooldown(0n);
    return base;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DEPLOYMENT
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Deployment", function () {
    it("Should set the correct USDC address", async function () {
      const { faucet, usdc } = await loadFixture(deployFaucetFixture);
      expect(await faucet.usdc()).to.equal(await usdc.getAddress());
    });

    it("Should set the correct owner", async function () {
      const { faucet, owner } = await loadFixture(deployFaucetFixture);
      expect(await faucet.owner()).to.equal(owner.address);
    });

    it("Should set default drip amount to 10,000 USDC", async function () {
      const { faucet, DEFAULT_DRIP_AMOUNT } = await loadFixture(deployFaucetFixture);
      expect(await faucet.dripAmount()).to.equal(DEFAULT_DRIP_AMOUNT);
    });

    it("Should set default cooldown to 24 hours", async function () {
      const { faucet, DEFAULT_COOLDOWN } = await loadFixture(deployFaucetFixture);
      expect(await faucet.cooldown()).to.equal(DEFAULT_COOLDOWN);
    });

    it("Should revert on zero USDC address", async function () {
      const USDCFaucet = await ethers.getContractFactory("USDCFaucet");
      await expect(USDCFaucet.deploy(ethers.ZeroAddress))
        .to.be.revertedWithCustomError({ interface: (await USDCFaucet.deploy(await (await (await ethers.getContractFactory("MockUSDC")).deploy()).getAddress())).interface }, "ZeroAddress");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // drip() — caller receives USDC
  // ═══════════════════════════════════════════════════════════════════════════

  describe("drip()", function () {
    it("Should mint dripAmount USDC to caller on first drip", async function () {
      const { faucet, usdc, user1, DEFAULT_DRIP_AMOUNT, USDC_UNIT } =
        await loadFixture(deployFaucetNoCooldownFixture);

      const before = await usdc.balanceOf(user1.address);
      await faucet.connect(user1).drip();
      const after = await usdc.balanceOf(user1.address);

      expect(after - before).to.equal(DEFAULT_DRIP_AMOUNT * USDC_UNIT);
    });

    it("Should emit Dripped event with correct args", async function () {
      const { faucet, user1, DEFAULT_DRIP_AMOUNT } =
        await loadFixture(deployFaucetNoCooldownFixture);

      await expect(faucet.connect(user1).drip())
        .to.emit(faucet, "Dripped")
        .withArgs(user1.address, DEFAULT_DRIP_AMOUNT);
    });

    it("Should record lastDrip timestamp for caller", async function () {
      const { faucet, user1 } = await loadFixture(deployFaucetNoCooldownFixture);

      await faucet.connect(user1).drip();
      const lastDrip = await faucet.lastDrip(user1.address);
      const now = BigInt(await time.latest());

      expect(lastDrip).to.be.closeTo(now, 2n);
    });

    it("Should allow multiple different users to drip independently", async function () {
      const { faucet, usdc, user1, user2, DEFAULT_DRIP_AMOUNT, USDC_UNIT } =
        await loadFixture(deployFaucetNoCooldownFixture);

      await faucet.connect(user1).drip();
      await faucet.connect(user2).drip();

      expect(await usdc.balanceOf(user1.address)).to.equal(DEFAULT_DRIP_AMOUNT * USDC_UNIT);
      expect(await usdc.balanceOf(user2.address)).to.equal(DEFAULT_DRIP_AMOUNT * USDC_UNIT);
    });

    it("Should revert with CooldownNotElapsed when called again too soon", async function () {
      const { faucet, user1, DEFAULT_COOLDOWN } = await loadFixture(deployFaucetFixture);

      // First drip succeeds (lastDrip starts at 0, so elapsed = block.timestamp >= cooldown only at deploy)
      // Fast-forward so first drip works
      await time.increase(DEFAULT_COOLDOWN);
      await faucet.connect(user1).drip();

      // Immediately call again — should fail
      await expect(faucet.connect(user1).drip())
        .to.be.revertedWithCustomError(faucet, "CooldownNotElapsed");
    });

    it("Should revert CooldownNotElapsed with correct secondsRemaining", async function () {
      const { faucet, user1, DEFAULT_COOLDOWN } = await loadFixture(deployFaucetFixture);

      await time.increase(DEFAULT_COOLDOWN);
      await faucet.connect(user1).drip();

      // Advance only half the cooldown
      const half = DEFAULT_COOLDOWN / 2n;
      await time.increase(half);

      await expect(faucet.connect(user1).drip())
        .to.be.revertedWithCustomError(faucet, "CooldownNotElapsed")
        .withArgs(DEFAULT_COOLDOWN - half - 1n); // -1 for the block that advanced
    });

    it("Should allow drip again after full cooldown has elapsed", async function () {
      const { faucet, usdc, user1, DEFAULT_DRIP_AMOUNT, DEFAULT_COOLDOWN, USDC_UNIT } =
        await loadFixture(deployFaucetFixture);

      await time.increase(DEFAULT_COOLDOWN);
      await faucet.connect(user1).drip();

      // Advance full cooldown
      await time.increase(DEFAULT_COOLDOWN);
      await faucet.connect(user1).drip();

      expect(await usdc.balanceOf(user1.address)).to.equal(DEFAULT_DRIP_AMOUNT * 2n * USDC_UNIT);
    });

    it("Should use updated dripAmount after setDripAmount is called", async function () {
      const { faucet, usdc, user1, USDC_UNIT } =
        await loadFixture(deployFaucetNoCooldownFixture);

      const newAmount = 5_000n;
      await faucet.setDripAmount(newAmount);

      const before = await usdc.balanceOf(user1.address);
      await faucet.connect(user1).drip();
      expect(await usdc.balanceOf(user1.address) - before).to.equal(newAmount * USDC_UNIT);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // dripTo() — caller triggers drip for a recipient
  // ═══════════════════════════════════════════════════════════════════════════

  describe("dripTo()", function () {
    it("Should mint dripAmount USDC to specified recipient", async function () {
      const { faucet, usdc, user1, user2, DEFAULT_DRIP_AMOUNT, USDC_UNIT } =
        await loadFixture(deployFaucetNoCooldownFixture);

      const before = await usdc.balanceOf(user2.address);
      await faucet.connect(user1).dripTo(user2.address);
      expect(await usdc.balanceOf(user2.address) - before).to.equal(DEFAULT_DRIP_AMOUNT * USDC_UNIT);
    });

    it("Should emit Dripped event with recipient address", async function () {
      const { faucet, user1, user2, DEFAULT_DRIP_AMOUNT } =
        await loadFixture(deployFaucetNoCooldownFixture);

      await expect(faucet.connect(user1).dripTo(user2.address))
        .to.emit(faucet, "Dripped")
        .withArgs(user2.address, DEFAULT_DRIP_AMOUNT);
    });

    it("Should record lastDrip for recipient, not caller", async function () {
      const { faucet, user1, user2 } = await loadFixture(deployFaucetNoCooldownFixture);

      await faucet.connect(user1).dripTo(user2.address);

      // user1 lastDrip should still be 0
      expect(await faucet.lastDrip(user1.address)).to.equal(0n);
      // user2 lastDrip should be set
      expect(await faucet.lastDrip(user2.address)).to.be.gt(0n);
    });

    it("Should revert with ZeroAddress when recipient is zero address", async function () {
      const { faucet, user1 } = await loadFixture(deployFaucetNoCooldownFixture);

      await expect(faucet.connect(user1).dripTo(ethers.ZeroAddress))
        .to.be.revertedWithCustomError(faucet, "ZeroAddress");
    });

    it("Should revert CooldownNotElapsed when recipient dripped too recently", async function () {
      const { faucet, user1, user2, DEFAULT_COOLDOWN } = await loadFixture(deployFaucetFixture);

      await time.increase(DEFAULT_COOLDOWN);
      await faucet.connect(user1).dripTo(user2.address);

      // Try to drip to same recipient again immediately
      await expect(faucet.connect(user1).dripTo(user2.address))
        .to.be.revertedWithCustomError(faucet, "CooldownNotElapsed");
    });

    it("Should allow different callers to dripTo same recipient after cooldown", async function () {
      const { faucet, usdc, user1, user2, DEFAULT_DRIP_AMOUNT, DEFAULT_COOLDOWN, USDC_UNIT } =
        await loadFixture(deployFaucetFixture);

      await time.increase(DEFAULT_COOLDOWN);
      await faucet.connect(user1).dripTo(user2.address);
      await time.increase(DEFAULT_COOLDOWN);
      await faucet.connect(user1).dripTo(user2.address);

      expect(await usdc.balanceOf(user2.address)).to.equal(DEFAULT_DRIP_AMOUNT * 2n * USDC_UNIT);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // cooldownRemaining() — view: seconds until user can drip again
  // ═══════════════════════════════════════════════════════════════════════════

  describe("cooldownRemaining()", function () {
    it("Should return 0 for a fresh address that has never dripped", async function () {
      const { faucet, user1 } = await loadFixture(deployFaucetFixture);
      expect(await faucet.cooldownRemaining(user1.address)).to.equal(0n);
    });

    it("Should return remaining seconds after a drip", async function () {
      const { faucet, user1, DEFAULT_COOLDOWN } = await loadFixture(deployFaucetFixture);

      await time.increase(DEFAULT_COOLDOWN);
      await faucet.connect(user1).drip();

      const remaining = await faucet.cooldownRemaining(user1.address);
      // Should be approximately DEFAULT_COOLDOWN (within 2 seconds of block timing)
      expect(remaining).to.be.closeTo(DEFAULT_COOLDOWN, 2n);
    });

    it("Should return 0 once full cooldown has elapsed", async function () {
      const { faucet, user1, DEFAULT_COOLDOWN } = await loadFixture(deployFaucetFixture);

      await time.increase(DEFAULT_COOLDOWN);
      await faucet.connect(user1).drip();
      await time.increase(DEFAULT_COOLDOWN + 1n);

      expect(await faucet.cooldownRemaining(user1.address)).to.equal(0n);
    });

    it("Should decrease over time after a drip", async function () {
      const { faucet, user1, DEFAULT_COOLDOWN } = await loadFixture(deployFaucetFixture);

      await time.increase(DEFAULT_COOLDOWN);
      await faucet.connect(user1).drip();

      const before = await faucet.cooldownRemaining(user1.address);
      await time.increase(1_000n);
      const after = await faucet.cooldownRemaining(user1.address);

      expect(after).to.be.lt(before);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // canDrip() — view: boolean readiness check
  // ═══════════════════════════════════════════════════════════════════════════

  describe("canDrip()", function () {
    it("Should return true for fresh address that has never dripped", async function () {
      const { faucet, user1 } = await loadFixture(deployFaucetFixture);
      expect(await faucet.canDrip(user1.address)).to.be.true;
    });

    it("Should return false immediately after drip", async function () {
      const { faucet, user1, DEFAULT_COOLDOWN } = await loadFixture(deployFaucetFixture);

      await time.increase(DEFAULT_COOLDOWN);
      await faucet.connect(user1).drip();

      expect(await faucet.canDrip(user1.address)).to.be.false;
    });

    it("Should return true after full cooldown has elapsed", async function () {
      const { faucet, user1, DEFAULT_COOLDOWN } = await loadFixture(deployFaucetFixture);

      await time.increase(DEFAULT_COOLDOWN);
      await faucet.connect(user1).drip();
      await time.increase(DEFAULT_COOLDOWN + 1n);

      expect(await faucet.canDrip(user1.address)).to.be.true;
    });

    it("Should return true when cooldown is 0 (testnet mode)", async function () {
      const { faucet, user1 } = await loadFixture(deployFaucetNoCooldownFixture);

      await faucet.connect(user1).drip();

      // Even right after drip, canDrip returns true when cooldown=0
      expect(await faucet.canDrip(user1.address)).to.be.true;
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // setDripAmount() — owner only
  // ═══════════════════════════════════════════════════════════════════════════

  describe("setDripAmount()", function () {
    it("Should update dripAmount correctly", async function () {
      const { faucet } = await loadFixture(deployFaucetFixture);

      await faucet.setDripAmount(500n);
      expect(await faucet.dripAmount()).to.equal(500n);
    });

    it("Should emit DripAmountUpdated event with new amount", async function () {
      const { faucet } = await loadFixture(deployFaucetFixture);

      await expect(faucet.setDripAmount(250n))
        .to.emit(faucet, "DripAmountUpdated")
        .withArgs(250n);
    });

    it("Should revert when called by non-owner", async function () {
      const { faucet, stranger } = await loadFixture(deployFaucetFixture);

      await expect(faucet.connect(stranger).setDripAmount(1000n))
        .to.be.revertedWithCustomError(faucet, "OwnableUnauthorizedAccount")
        .withArgs(stranger.address);
    });

    it("Should allow setting dripAmount to 0", async function () {
      const { faucet } = await loadFixture(deployFaucetFixture);

      await faucet.setDripAmount(0n);
      expect(await faucet.dripAmount()).to.equal(0n);
    });

    it("Should allow setting dripAmount to a very large value", async function () {
      const { faucet } = await loadFixture(deployFaucetFixture);

      const large = 1_000_000_000n;
      await faucet.setDripAmount(large);
      expect(await faucet.dripAmount()).to.equal(large);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // setCooldown() — owner only
  // ═══════════════════════════════════════════════════════════════════════════

  describe("setCooldown()", function () {
    it("Should update cooldown correctly", async function () {
      const { faucet } = await loadFixture(deployFaucetFixture);

      await faucet.setCooldown(3600n); // 1 hour
      expect(await faucet.cooldown()).to.equal(3600n);
    });

    it("Should emit CooldownUpdated event with new value", async function () {
      const { faucet } = await loadFixture(deployFaucetFixture);

      await expect(faucet.setCooldown(3600n))
        .to.emit(faucet, "CooldownUpdated")
        .withArgs(3600n);
    });

    it("Should revert when called by non-owner", async function () {
      const { faucet, stranger } = await loadFixture(deployFaucetFixture);

      await expect(faucet.connect(stranger).setCooldown(0n))
        .to.be.revertedWithCustomError(faucet, "OwnableUnauthorizedAccount")
        .withArgs(stranger.address);
    });

    it("Should allow setting cooldown to 0 (testnet no-wait mode)", async function () {
      const { faucet, user1 } = await loadFixture(deployFaucetFixture);

      await faucet.setCooldown(0n);
      expect(await faucet.cooldown()).to.equal(0n);

      // User should be able to drip repeatedly with no waiting
      await faucet.connect(user1).drip();
      await faucet.connect(user1).drip();
    });

    it("Should allow setting a very long cooldown", async function () {
      const { faucet } = await loadFixture(deployFaucetFixture);

      const oneYear = 365n * 24n * 3600n;
      await faucet.setCooldown(oneYear);
      expect(await faucet.cooldown()).to.equal(oneYear);
    });

    it("drip should respect updated cooldown immediately", async function () {
      const { faucet, user1 } = await loadFixture(deployFaucetFixture);

      // Set cooldown to 1 hour
      await faucet.setCooldown(3600n);
      await time.increase(3600n);
      await faucet.connect(user1).drip();

      // Advance only 30 min — should fail
      await time.increase(1800n);
      await expect(faucet.connect(user1).drip())
        .to.be.revertedWithCustomError(faucet, "CooldownNotElapsed");

      // Advance another 30 min — should pass
      await time.increase(1800n);
      await expect(faucet.connect(user1).drip()).not.to.be.reverted;
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ownerDrip() — owner bypass, no cooldown check
  // ═══════════════════════════════════════════════════════════════════════════

  describe("ownerDrip()", function () {
    it("Should mint specified amount to recipient", async function () {
      const { faucet, usdc, user1, USDC_UNIT } = await loadFixture(deployFaucetFixture);

      const amount = 50_000n;
      const before = await usdc.balanceOf(user1.address);
      await faucet.ownerDrip(user1.address, amount);
      expect(await usdc.balanceOf(user1.address) - before).to.equal(amount * USDC_UNIT);
    });

    it("Should emit Dripped event with recipient and amount", async function () {
      const { faucet, user1 } = await loadFixture(deployFaucetFixture);

      const amount = 99_999n;
      await expect(faucet.ownerDrip(user1.address, amount))
        .to.emit(faucet, "Dripped")
        .withArgs(user1.address, amount);
    });

    it("Should bypass cooldown for recipient who dripped recently", async function () {
      const { faucet, usdc, user1, DEFAULT_DRIP_AMOUNT, DEFAULT_COOLDOWN, USDC_UNIT } =
        await loadFixture(deployFaucetFixture);

      // User drips normally
      await time.increase(DEFAULT_COOLDOWN);
      await faucet.connect(user1).drip();

      // Owner can immediately drip to same user
      await expect(faucet.ownerDrip(user1.address, DEFAULT_DRIP_AMOUNT)).not.to.be.reverted;
      expect(await usdc.balanceOf(user1.address)).to.equal(DEFAULT_DRIP_AMOUNT * 2n * USDC_UNIT);
    });

    it("Should NOT update lastDrip for recipient", async function () {
      const { faucet, user1, DEFAULT_COOLDOWN } = await loadFixture(deployFaucetFixture);

      // lastDrip before
      const before = await faucet.lastDrip(user1.address);
      await faucet.ownerDrip(user1.address, 1000n);
      const after = await faucet.lastDrip(user1.address);

      // ownerDrip doesn't touch lastDrip
      expect(before).to.equal(after);
    });

    it("Should revert with ZeroAddress on zero recipient", async function () {
      const { faucet } = await loadFixture(deployFaucetFixture);

      await expect(faucet.ownerDrip(ethers.ZeroAddress, 1000n))
        .to.be.revertedWithCustomError(faucet, "ZeroAddress");
    });

    it("Should revert when called by non-owner", async function () {
      const { faucet, user1, stranger } = await loadFixture(deployFaucetFixture);

      await expect(faucet.connect(stranger).ownerDrip(user1.address, 1000n))
        .to.be.revertedWithCustomError(faucet, "OwnableUnauthorizedAccount")
        .withArgs(stranger.address);
    });

    it("Should allow ownerDrip with any custom amount", async function () {
      const { faucet, usdc, user1, USDC_UNIT } = await loadFixture(deployFaucetFixture);

      const customAmount = 1n;
      await faucet.ownerDrip(user1.address, customAmount);
      expect(await usdc.balanceOf(user1.address)).to.equal(customAmount * USDC_UNIT);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Integration — minter whitelist interaction with MockUSDC
  // ═══════════════════════════════════════════════════════════════════════════

  describe("MockUSDC minter integration", function () {
    it("Should revert drip if faucet is not whitelisted as minter", async function () {
      const [owner, user1] = await ethers.getSigners();
      const MockUSDC = await ethers.getContractFactory("MockUSDC");
      const usdc = await MockUSDC.deploy();

      const USDCFaucet = await ethers.getContractFactory("USDCFaucet");
      const faucet = await USDCFaucet.deploy(await usdc.getAddress());
      // Deliberately NOT calling usdc.setMinter(faucet, true)

      await expect(faucet.connect(user1).drip())
        .to.be.revertedWithCustomError(usdc, "NotMinter");
    });

    it("Should revert dripTo if faucet is not whitelisted as minter", async function () {
      const [owner, user1, user2] = await ethers.getSigners();
      const MockUSDC = await ethers.getContractFactory("MockUSDC");
      const usdc = await MockUSDC.deploy();

      const USDCFaucet = await ethers.getContractFactory("USDCFaucet");
      const faucet = await USDCFaucet.deploy(await usdc.getAddress());

      await expect(faucet.connect(user1).dripTo(user2.address))
        .to.be.revertedWithCustomError(usdc, "NotMinter");
    });

    it("Should revert if faucet minter is revoked mid-operation", async function () {
      const { faucet, usdc, user1 } = await loadFixture(deployFaucetNoCooldownFixture);

      // First drip works
      await faucet.connect(user1).drip();

      // Owner revokes faucet minter permission
      await usdc.setMinter(await faucet.getAddress(), false);

      // Second drip should now revert
      await expect(faucet.connect(user1).drip())
        .to.be.revertedWithCustomError(usdc, "NotMinter");
    });

    it("Should correctly mint 6-decimal USDC amounts", async function () {
      const { faucet, usdc, user1, DEFAULT_DRIP_AMOUNT, USDC_UNIT } =
        await loadFixture(deployFaucetNoCooldownFixture);

      await faucet.connect(user1).drip();

      // 10,000 whole USDC = 10,000,000,000 base units (6 decimals)
      expect(await usdc.balanceOf(user1.address)).to.equal(DEFAULT_DRIP_AMOUNT * USDC_UNIT);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Edge cases & combined scenarios
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Edge cases", function () {
    it("drip and dripTo cooldowns are tracked per-address independently", async function () {
      const { faucet, usdc, user1, user2, DEFAULT_DRIP_AMOUNT, DEFAULT_COOLDOWN, USDC_UNIT } =
        await loadFixture(deployFaucetFixture);

      await time.increase(DEFAULT_COOLDOWN);
      await faucet.connect(user1).drip();        // user1 starts cooldown
      await faucet.connect(user2).dripTo(user2.address); // user2 starts cooldown separately

      // user1 can't drip again but user2's cooldown is also set
      await expect(faucet.connect(user1).drip()).to.be.revertedWithCustomError(faucet, "CooldownNotElapsed");
      await expect(faucet.connect(user1).dripTo(user2.address)).to.be.revertedWithCustomError(faucet, "CooldownNotElapsed");
    });

    it("caller dripping to themselves via dripTo works same as drip()", async function () {
      const { faucet, usdc, user1, DEFAULT_DRIP_AMOUNT, USDC_UNIT } =
        await loadFixture(deployFaucetNoCooldownFixture);

      const before = await usdc.balanceOf(user1.address);
      await faucet.connect(user1).dripTo(user1.address);
      expect(await usdc.balanceOf(user1.address) - before).to.equal(DEFAULT_DRIP_AMOUNT * USDC_UNIT);
    });

    it("Multiple ownerDrips in a row all succeed regardless of cooldown", async function () {
      const { faucet, usdc, user1, USDC_UNIT } = await loadFixture(deployFaucetFixture);

      const amount = 1000n;
      await faucet.ownerDrip(user1.address, amount);
      await faucet.ownerDrip(user1.address, amount);
      await faucet.ownerDrip(user1.address, amount);

      expect(await usdc.balanceOf(user1.address)).to.equal(amount * 3n * USDC_UNIT);
    });

    it("Changing dripAmount does not affect already-completed drips", async function () {
      const { faucet, usdc, user1, user2, DEFAULT_DRIP_AMOUNT, USDC_UNIT } =
        await loadFixture(deployFaucetNoCooldownFixture);

      await faucet.connect(user1).drip();
      // Change drip amount
      await faucet.setDripAmount(1n);
      // user2 gets new amount
      await faucet.connect(user2).drip();

      expect(await usdc.balanceOf(user1.address)).to.equal(DEFAULT_DRIP_AMOUNT * USDC_UNIT);
      expect(await usdc.balanceOf(user2.address)).to.equal(1n * USDC_UNIT);
    });

    it("lastDrip mapping correctly stores per-user timestamps", async function () {
      const { faucet, user1, user2, DEFAULT_COOLDOWN } = await loadFixture(deployFaucetFixture);

      await time.increase(DEFAULT_COOLDOWN);
      await faucet.connect(user1).drip();
      const ts1 = await faucet.lastDrip(user1.address);

      await time.increase(100n);
      await faucet.connect(user2).drip();
      const ts2 = await faucet.lastDrip(user2.address);

      expect(ts2).to.be.gt(ts1);
      expect(await faucet.lastDrip(user1.address)).to.equal(ts1); // user1 unchanged
    });
  });
});
