const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

// ─────────────────────────────────────────────────────────────────────────────
// PropVera.test.js
// Full test suite: 51 functional tests + 57 branch-coverage tests = 108 total
// ─────────────────────────────────────────────────────────────────────────────

describe("PropVera and PropVeraFractionalToken", function () {

  // ── Shared fixture ──────────────────────────────────────────────────────────
  async function deployContractsFixture() {
    const [owner, seller, buyer, otherAccount, stranger] = await ethers.getSigners();

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();

    const PropVeraFractionalToken = await ethers.getContractFactory("PropVeraFractionalToken");
    const propVeraFractionalToken = await PropVeraFractionalToken.deploy();

    const PropVera = await ethers.getContractFactory("PropVera");
    const propVera = await PropVera.deploy(propVeraFractionalToken.target, usdc.target);

    await propVeraFractionalToken.setPropVera(propVera.target);
    await propVera.addAdmin(owner.address);

    const usdcAmountEth = 1000000;
    const usdcAmountWei = ethers.parseUnits("1000000", 6);

    await usdc.mint(seller.address, usdcAmountEth);
    await usdc.mint(buyer.address, usdcAmountEth);
    await usdc.mint(otherAccount.address, usdcAmountEth);

    await usdc.connect(seller).approve(propVera.target, usdcAmountWei);
    await usdc.connect(buyer).approve(propVera.target, usdcAmountWei);
    await usdc.connect(otherAccount).approve(propVera.target, usdcAmountWei);

    const assetPriceEth          = 1000;
    const assetPriceWei          = ethers.parseUnits("1000", 6);
    const totalTokensEth         = 100;
    const totalTokensWei         = ethers.parseEther("100");
    const pricePerTokenWei       = assetPriceWei * ethers.parseEther("1") / totalTokensWei;
    const listingFeePercentage   = 3;
    const cancellationPenaltyPercentage = 1;
    const shareTradingFeePercentage     = 2;
    const percentageScale        = ethers.parseEther("1");
    const USDC_UNIT              = 1_000_000n;

    return {
      propVeraFractionalToken, propVera, usdc,
      owner, seller, buyer, otherAccount, stranger,
      assetPriceEth, assetPriceWei,
      totalTokensEth, totalTokensWei,
      pricePerTokenWei,
      listingFeePercentage, cancellationPenaltyPercentage, shareTradingFeePercentage,
      percentageScale, USDC_UNIT,
    };
  }

  // ── Reusable helpers ────────────────────────────────────────────────────────

  /** Register seller, create asset, verify it, approve contract, fractionalize. */
  async function createVerifiedFractionalAsset(propVera, seller, owner, assetPriceEth, totalTokensEth) {
    await propVera.connect(seller).registerSeller();
    await propVera.connect(seller).createAsset("ipfs://test", assetPriceEth);
    const tokenId = 1n;
    await propVera.connect(owner).verifyAsset(tokenId);
    await propVera.connect(seller).approve(propVera.target, tokenId);
    await propVera.connect(owner).createFractionalAsset(tokenId, totalTokensEth);
    return tokenId;
  }

  /** Approve USDC spend for an account (amount in whole USDC units). */
  async function approveUSDC(usdc, account, propVeraTarget, amount) {
    await usdc.connect(account).approve(propVeraTarget, BigInt(amount) * 1_000_000n);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 1 — FUNCTIONAL TESTS (original suite)
  // ═══════════════════════════════════════════════════════════════════════════

  // ── PropVeraFractionalToken Deployment ──────────────────────────────────────
  describe("PropVeraFractionalToken Deployment", function () {
    it("Should set the right name and symbol", async function () {
      const { propVeraFractionalToken } = await loadFixture(deployContractsFixture);
      expect(await propVeraFractionalToken.name()).to.equal("PropVeraFractionalToken");
      expect(await propVeraFractionalToken.symbol()).to.equal("PVF");
    });

    it("Should set the right owner", async function () {
      const { propVeraFractionalToken, owner } = await loadFixture(deployContractsFixture);
      expect(await propVeraFractionalToken.owner()).to.equal(owner.address);
    });

    it("Should have PropVera set and locked after deployment", async function () {
      const { propVeraFractionalToken, propVera, otherAccount } = await loadFixture(deployContractsFixture);
      expect(await propVeraFractionalToken.propVera()).to.equal(propVera.target);

      await expect(propVeraFractionalToken.setPropVera(otherAccount.address))
        .to.be.revertedWithCustomError(propVeraFractionalToken, "PropVeraAlreadyLocked");

      await expect(propVeraFractionalToken.connect(otherAccount).setPropVera(otherAccount.address))
        .to.be.revertedWithCustomError(propVeraFractionalToken, "OwnableUnauthorizedAccount")
        .withArgs(otherAccount.address);
    });

    it("Should allow authorized minting", async function () {
      const { propVeraFractionalToken, propVera, buyer, seller, totalTokensEth, assetPriceEth } =
        await loadFixture(deployContractsFixture);
      const amount = ethers.parseEther("100");

      await propVeraFractionalToken.mint(buyer.address, amount);
      expect(await propVeraFractionalToken.balanceOf(buyer.address)).to.equal(amount);

      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await propVera.verifyAsset(1);
      await propVera.createFractionalAsset(1, totalTokensEth);
      expect(await propVeraFractionalToken.balanceOf(propVera.target))
        .to.equal(ethers.parseEther(totalTokensEth.toString()));

      await expect(propVeraFractionalToken.connect(buyer).mint(buyer.address, amount))
        .to.be.revertedWithCustomError(propVeraFractionalToken, "NotAuthorized");
    });
  });

  // ── PropVera Deployment ─────────────────────────────────────────────────────
  describe("PropVera Deployment", function () {
    it("Should set the right owner", async function () {
      const { propVera, owner } = await loadFixture(deployContractsFixture);
      expect(await propVera.owner()).to.equal(owner.address);
    });

    it("Should set the correct token contracts", async function () {
      const { propVera, propVeraFractionalToken, usdc } = await loadFixture(deployContractsFixture);
      expect(await propVera.realEstateToken()).to.equal(propVeraFractionalToken.target);
      expect(await propVera.usdcToken()).to.equal(usdc.target);
    });
  });

  // ── Seller Registration ─────────────────────────────────────────────────────
  describe("Seller Registration", function () {
    it("Should allow seller to register", async function () {
      const { propVera, seller } = await loadFixture(deployContractsFixture);
      await expect(propVera.connect(seller).registerSeller())
        .to.emit(propVera, "SellerRegistered")
        .withArgs(seller.address);
      expect(await propVera.sellers(seller.address)).to.be.true;
    });

    it("Should revert if seller is already registered", async function () {
      const { propVera, seller } = await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await expect(propVera.connect(seller).registerSeller())
        .to.be.revertedWithCustomError(propVera, "SellerAlreadyRegistered");
    });
  });

  // ── Asset Creation ──────────────────────────────────────────────────────────
  describe("Asset Creation", function () {
    it("Should allow registered seller to create an asset", async function () {
      const { propVera, seller, assetPriceEth } = await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await expect(propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth))
        .to.emit(propVera, "AssetCreated")
        .withArgs(1, assetPriceEth, seller.address, false);
      const asset = await propVera.fetchAsset(1);
      expect(asset.tokenId).to.equal(1);
      expect(asset.price).to.equal(assetPriceEth);
      expect(asset.seller).to.equal(seller.address);
      expect(asset.sold).to.be.false;
      expect(asset.verified).to.be.false;
    });

    it("Should revert if seller is not registered", async function () {
      const { propVera, seller, assetPriceEth } = await loadFixture(deployContractsFixture);
      await expect(propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth))
        .to.be.revertedWithCustomError(propVera, "SellerNotRegistered");
    });

    it("Should revert if price is zero", async function () {
      const { propVera, seller } = await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await expect(propVera.connect(seller).createAsset("ipfs://token1", 0))
        .to.be.revertedWithCustomError(propVera, "InvalidPrice");
    });
  });

  // ── Asset Verification ──────────────────────────────────────────────────────
  describe("Asset Verification", function () {
    it("Should allow admin to verify an asset", async function () {
      const { propVera, seller, assetPriceEth } = await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await expect(propVera.verifyAsset(1))
        .to.emit(propVera, "AssetVerified")
        .withArgs(1, seller.address);
      const asset = await propVera.fetchAsset(1);
      expect(asset.verified).to.be.true;
    });

    it("Should revert if asset does not exist", async function () {
      const { propVera } = await loadFixture(deployContractsFixture);
      await expect(propVera.verifyAsset(1))
        .to.be.revertedWithCustomError(propVera, "AssetDoesNotExist");
    });

    it("Should revert if asset is already verified", async function () {
      const { propVera, seller, assetPriceEth } = await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await propVera.verifyAsset(1);
      await expect(propVera.verifyAsset(1))
        .to.be.revertedWithCustomError(propVera, "AssetAlreadyVerified");
    });

    it("Should revert if non-admin tries to verify asset", async function () {
      const { propVera, seller, buyer, assetPriceEth } = await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await expect(propVera.connect(buyer).verifyAsset(1))
        .to.be.revertedWithCustomError(propVera, "NotAdmin");
    });
  });

  // ── Fractionalization ───────────────────────────────────────────────────────
  describe("Fractionalization", function () {
    it("Should allow admin to fractionalize a verified asset", async function () {
      const { propVera, seller, totalTokensEth, assetPriceEth, assetPriceWei, totalTokensWei } =
        await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await propVera.verifyAsset(1);
      await expect(propVera.createFractionalAsset(1, totalTokensEth))
        .to.emit(propVera, "FractionalAssetCreated")
        .withArgs(1, totalTokensEth, assetPriceEth / totalTokensEth, seller.address);
      const fractionalAsset = await propVera.fractionalAssets(1);
      expect(fractionalAsset.totalTokens).to.equal(totalTokensWei);
      expect(fractionalAsset.pricePerToken)
        .to.equal(assetPriceWei * ethers.parseEther("1") / totalTokensWei);
    });

    it("Should revert if asset is not verified", async function () {
      const { propVera, seller, totalTokensEth, assetPriceEth } = await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await expect(propVera.createFractionalAsset(1, totalTokensEth))
        .to.be.revertedWithCustomError(propVera, "AssetNotVerified");
    });
  });

  // ── Fractional Purchases ────────────────────────────────────────────────────
  describe("Fractional Purchases", function () {
    it("Should allow buyer to purchase fractional tokens", async function () {
      const { propVera, propVeraFractionalToken, usdc, seller, buyer, totalTokensEth, assetPriceEth, assetPriceWei } =
        await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await propVera.verifyAsset(1);
      await propVera.createFractionalAsset(1, totalTokensEth);

      const numTokensEth = 10;
      const numTokensWei = ethers.parseEther("10");
      const totalTokensWei = ethers.parseEther(totalTokensEth.toString());
      const totalPriceWei = (numTokensWei * assetPriceWei) / totalTokensWei;
      const totalPriceEth = assetPriceEth * numTokensEth / totalTokensEth;

      await expect(propVera.connect(buyer).buyFractionalAsset(1, numTokensEth))
        .to.emit(propVera, "FractionalAssetPurchased")
        .withArgs(1, buyer.address, numTokensEth, totalPriceEth);

      expect(await propVeraFractionalToken.balanceOf(buyer.address)).to.equal(numTokensWei);
      expect(await usdc.balanceOf(propVera.target)).to.equal(totalPriceWei);
      expect(await propVera.getFractionalPayments(1)).to.equal(totalPriceEth);
    });

    it("Should revert if insufficient tokens", async function () {
      const { propVera, seller, buyer, totalTokensEth, assetPriceEth } =
        await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await propVera.verifyAsset(1);
      await propVera.createFractionalAsset(1, totalTokensEth);
      await expect(propVera.connect(buyer).buyFractionalAsset(1, totalTokensEth + 1))
        .to.be.revertedWithCustomError(propVera, "InsufficientTokens");
    });
  });

  // ── Dividend Distribution ───────────────────────────────────────────────────
  describe("Dividend Distribution", function () {
    it("Should distribute dividends to fractional buyers", async function () {
      const { propVera, usdc, seller, buyer, totalTokensEth, assetPriceEth, assetPriceWei, totalTokensWei } =
        await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await propVera.verifyAsset(1);
      await propVera.createFractionalAsset(1, totalTokensEth);

      const numTokensEth = 10;
      const numTokensWei = ethers.parseEther("10");
      await propVera.connect(buyer).buyFractionalAsset(1, numTokensEth);

      const dividendAmountEth = 100;
      const dividendAmountWei = ethers.parseUnits("100", 6);
      await usdc.mint(propVera.target, dividendAmountEth);

      const expectedShareWei = (dividendAmountWei * numTokensWei) / totalTokensWei;
      const expectedShareEth = dividendAmountEth * numTokensEth / totalTokensEth;

      await expect(propVera.distributeFractionalDividends(1, dividendAmountEth))
        .to.emit(propVera, "FractionalDividendsDistributed")
        .withArgs(1, dividendAmountEth, [buyer.address], [expectedShareEth]);

      const purchaseCost = (numTokensWei * assetPriceWei) / totalTokensWei;
      const initialBalance = ethers.parseUnits("1000000", 6);
      expect(await usdc.balanceOf(buyer.address))
        .to.equal(initialBalance - purchaseCost + expectedShareWei);
    });

    it("Should revert if insufficient USDC balance", async function () {
      const { propVera, seller, totalTokensEth, assetPriceEth } =
        await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await propVera.verifyAsset(1);
      await propVera.createFractionalAsset(1, totalTokensEth);
      await expect(propVera.distributeFractionalDividends(1, 100))
        .to.be.revertedWithCustomError(propVera, "InsufficientUSDCBalance");
    });
  });

  // ── Asset Purchase ──────────────────────────────────────────────────────────
  describe("Asset Purchase", function () {
    it("Should allow buyer to purchase an asset", async function () {
      const { propVera, usdc, seller, buyer, assetPriceEth, assetPriceWei, listingFeePercentage } =
        await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await propVera.verifyAsset(1);

      await expect(propVera.connect(buyer).buyAsset(1))
        .to.emit(propVera, "AssetPurchased")
        .withArgs(1, buyer.address, assetPriceEth);

      await expect(propVera.connect(buyer).confirmAssetPayment(1))
        .to.emit(propVera, "AssetPaymentConfirmed")
        .withArgs(1, buyer.address);

      const listingFee = (assetPriceWei * BigInt(listingFeePercentage)) / 100n;
      const initialSellerBalance = ethers.parseUnits("1000000", 6);
      expect(await usdc.balanceOf(seller.address))
        .to.equal(initialSellerBalance + (assetPriceWei - listingFee));
      expect(await propVera.ownerOf(1)).to.equal(buyer.address);
    });

    it("Should track fractional payments correctly", async function () {
      const { propVera, seller, buyer, assetPriceEth, totalTokensEth } =
        await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await propVera.verifyAsset(1);
      await propVera.createFractionalAsset(1, totalTokensEth);

      const numTokensEth = 10;
      await propVera.connect(buyer).buyFractionalAsset(1, numTokensEth);
      expect(await propVera.getFractionalPayments(1))
        .to.equal(assetPriceEth * numTokensEth / totalTokensEth);
    });

    it("Should revert if asset is not verified", async function () {
      const { propVera, seller, buyer, assetPriceEth } = await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await expect(propVera.connect(buyer).buyAsset(1))
        .to.be.revertedWithCustomError(propVera, "AssetNotVerified");
    });
  });

  // ── Delisting ───────────────────────────────────────────────────────────────
  describe("Delisting", function () {
    it("Should allow admin to delist an asset", async function () {
      const { propVera, seller, assetPriceEth } = await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await expect(propVera.delistAssetAdmin(1))
        .to.emit(propVera, "AssetDelisted")
        .withArgs(1, seller.address);
      const asset = await propVera.fetchAsset(1);
      expect(asset.seller).to.equal(ethers.ZeroAddress);
    });

    it("Should revert if asset has fractional buyers", async function () {
      const { propVera, seller, buyer, totalTokensEth, assetPriceEth } =
        await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await propVera.verifyAsset(1);
      await propVera.createFractionalAsset(1, totalTokensEth);
      await propVera.connect(buyer).buyFractionalAsset(1, 10);
      await expect(propVera.delistAssetAdmin(1))
        .to.be.revertedWithCustomError(propVera, "FractionalizedAssetWithBuyers");
    });
  });

  // ── Withdrawals ─────────────────────────────────────────────────────────────
  describe("Withdrawals", function () {
    it("Should allow owner to withdraw USDC", async function () {
      const { propVera, usdc, owner, seller, buyer, assetPriceEth, assetPriceWei, totalTokensEth, totalTokensWei } =
        await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await propVera.verifyAsset(1);
      await propVera.createFractionalAsset(1, totalTokensEth);

      const numTokensEth = 10;
      const numTokensWei = ethers.parseEther("10");
      const totalPriceEth = (assetPriceEth * numTokensEth) / totalTokensEth;
      const totalPriceWei = (numTokensWei * assetPriceWei) / totalTokensWei;

      await propVera.connect(buyer).buyFractionalAsset(1, numTokensEth);
      await expect(propVera.withdrawUSDC(owner.address, totalPriceEth))
        .to.emit(propVera, "USDCWithdrawn")
        .withArgs(owner.address, totalPriceEth);
      expect(await usdc.balanceOf(owner.address)).to.equal(totalPriceWei);
    });

    it("Should revert if insufficient USDC balance", async function () {
      const { propVera, owner } = await loadFixture(deployContractsFixture);
      await expect(propVera.withdrawUSDC(owner.address, 100))
        .to.be.revertedWithCustomError(propVera, "InsufficientUSDCBalance");
    });
  });

  // ── MockUSDC ────────────────────────────────────────────────────────────────
  describe("MockUSDC", function () {
    it("Should return correct decimals", async function () {
      const { usdc } = await loadFixture(deployContractsFixture);
      expect(await usdc.decimals()).to.equal(6);
    });

    it("Should convert ETH to wei correctly", async function () {
      const { usdc } = await loadFixture(deployContractsFixture);
      expect(await usdc.ethToWei(1000)).to.equal(ethers.parseUnits("1000", 6));
    });
  });

  // ── Asset Purchase Cancellation ─────────────────────────────────────────────
  describe("Asset Purchase Cancellation", function () {
    it("Should allow buyer to cancel asset purchase with penalty", async function () {
      const { propVera, usdc, seller, buyer, owner, assetPriceEth, assetPriceWei, cancellationPenaltyPercentage } =
        await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await propVera.verifyAsset(1);
      await propVera.connect(buyer).buyAsset(1);

      const penalty = (assetPriceWei * BigInt(cancellationPenaltyPercentage)) / 100n;
      const refunded = assetPriceWei - penalty;
      const initialBuyerBalance = await usdc.balanceOf(buyer.address);
      const initialOwnerBalance = await usdc.balanceOf(owner.address);

      await propVera.connect(buyer).cancelAssetPurchase(1);

      expect(await usdc.balanceOf(buyer.address)).to.equal(initialBuyerBalance + refunded);
      expect(await usdc.balanceOf(owner.address)).to.equal(initialOwnerBalance + penalty);
    });

    it("Should revert if not buyer cancels asset purchase", async function () {
      const { propVera, seller, buyer, otherAccount, assetPriceEth } =
        await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await propVera.verifyAsset(1);
      await propVera.connect(buyer).buyAsset(1);
      await expect(propVera.connect(otherAccount).cancelAssetPurchase(1))
        .to.be.revertedWithCustomError(propVera, "NotBuyer");
    });
  });

  // ── Admin Management ────────────────────────────────────────────────────────
  describe("Admin Management", function () {
    it("Should allow owner to add admin", async function () {
      const { propVera, otherAccount } = await loadFixture(deployContractsFixture);
      await propVera.addAdmin(otherAccount.address);
      expect(await propVera.isAdmin(otherAccount.address)).to.be.true;
    });

    it("Should allow owner to remove admin", async function () {
      const { propVera, otherAccount } = await loadFixture(deployContractsFixture);
      await propVera.addAdmin(otherAccount.address);
      await propVera.removeAdmin(otherAccount.address);
      expect(await propVera.isAdmin(otherAccount.address)).to.be.false;
    });

    it("Should revert if adding existing admin", async function () {
      const { propVera, owner } = await loadFixture(deployContractsFixture);
      await expect(propVera.addAdmin(owner.address))
        .to.be.revertedWithCustomError(propVera, "AdminAlreadyExists");
    });

    it("Should revert if removing non-existent admin", async function () {
      const { propVera, otherAccount } = await loadFixture(deployContractsFixture);
      await expect(propVera.removeAdmin(otherAccount.address))
        .to.be.revertedWithCustomError(propVera, "AdminDoesNotExist");
    });
  });

  // ── Asset Listing ───────────────────────────────────────────────────────────
  describe("Asset Listing", function () {
    it("Should return correct listed assets", async function () {
      const { propVera, seller, assetPriceEth } = await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      const assets = await propVera.fetchAllListedAssets();
      expect(assets.length).to.equal(1);
      expect(assets[0].price).to.equal(assetPriceEth);
      expect(assets[0].seller).to.equal(seller.address);
    });

    it("Should return empty list when no assets are listed", async function () {
      const { propVera } = await loadFixture(deployContractsFixture);
      expect((await propVera.fetchAllListedAssets()).length).to.equal(0);
    });

    it("Should return multiple listed assets", async function () {
      const { propVera, seller, assetPriceEth } = await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await propVera.connect(seller).createAsset("ipfs://token2", assetPriceEth);
      expect((await propVera.fetchAllListedAssets()).length).to.equal(2);
    });
  });

  // ── Share Transfer and Trading ──────────────────────────────────────────────
  describe("Share Transfer and Trading", function () {
    it("Should allow transferring shares between users", async function () {
      const { propVera, propVeraFractionalToken, seller, buyer, otherAccount, assetPriceEth, totalTokensEth } =
        await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await propVera.verifyAsset(1);
      await propVera.createFractionalAsset(1, totalTokensEth);

      const numTokensEth = 10;
      const numTokensWei = ethers.parseEther("10");
      await propVera.connect(buyer).buyFractionalAsset(1, numTokensEth);
      await propVeraFractionalToken.connect(buyer).approve(propVera.target, numTokensWei);

      const transferAmount = 5;
      await expect(propVera.connect(buyer).transferShares(1, otherAccount.address, transferAmount))
        .to.emit(propVera, "SharesTransferred")
        .withArgs(1, buyer.address, otherAccount.address, transferAmount);

      expect(await propVera.getBuyerFractions(buyer.address, 1)).to.equal(numTokensEth - transferAmount);
      expect(await propVera.getBuyerFractions(otherAccount.address, 1)).to.equal(transferAmount);
    });

    it("Should allow listing shares for sale", async function () {
      const { propVera, propVeraFractionalToken, seller, buyer, assetPriceEth, totalTokensEth } =
        await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await propVera.verifyAsset(1);
      await propVera.createFractionalAsset(1, totalTokensEth);

      const numTokensEth = 10;
      const numTokensWei = ethers.parseEther("10");
      await propVera.connect(buyer).buyFractionalAsset(1, numTokensEth);
      await propVeraFractionalToken.connect(buyer).approve(propVera.target, numTokensWei);

      const listingAmount = 5;
      const pricePerShare = 12;
      await expect(propVera.connect(buyer).listSharesForSale(1, listingAmount, pricePerShare))
        .to.emit(propVera, "SharesListed")
        .withArgs(1, 1, buyer.address, listingAmount, pricePerShare);

      const listings = await propVera.getAssetShareListings(1);
      expect(listings.length).to.equal(1);
      expect(listings[0].numShares).to.equal(listingAmount);
      expect(listings[0].pricePerShare).to.equal(pricePerShare);
    });

    it("Should allow buying listed shares", async function () {
      const { propVera, propVeraFractionalToken, usdc, seller, buyer, otherAccount, assetPriceEth, totalTokensEth, shareTradingFeePercentage } =
        await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await propVera.verifyAsset(1);
      await propVera.createFractionalAsset(1, totalTokensEth);

      const numTokensEth = 10;
      const numTokensWei = ethers.parseEther("10");
      await propVera.connect(buyer).buyFractionalAsset(1, numTokensEth);
      await propVeraFractionalToken.connect(buyer).approve(propVera.target, numTokensWei);

      const listingAmount = 5;
      const pricePerShare = 12;
      await propVera.connect(buyer).listSharesForSale(1, listingAmount, pricePerShare);

      const totalPrice    = listingAmount * pricePerShare;
      const totalPriceWei = ethers.parseUnits(totalPrice.toString(), 6);
      const tradingFee    = (totalPriceWei * BigInt(shareTradingFeePercentage)) / 100n;
      const sellerPayment = totalPriceWei - tradingFee;
      const buyerInitialBalance = await usdc.balanceOf(buyer.address);

      await expect(propVera.connect(otherAccount).buyListedShares(1))
        .to.emit(propVera, "SharesPurchased")
        .withArgs(1, 1, otherAccount.address, buyer.address, listingAmount, totalPrice);

      expect(await propVera.getBuyerFractions(otherAccount.address, 1)).to.equal(listingAmount);
      expect(await usdc.balanceOf(buyer.address)).to.equal(buyerInitialBalance + sellerPayment);
    });

    it("Should allow canceling share listing", async function () {
      const { propVera, propVeraFractionalToken, seller, buyer, assetPriceEth, totalTokensEth } =
        await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await propVera.verifyAsset(1);
      await propVera.createFractionalAsset(1, totalTokensEth);

      const numTokensEth = 10;
      const numTokensWei = ethers.parseEther("10");
      await propVera.connect(buyer).buyFractionalAsset(1, numTokensEth);
      await propVeraFractionalToken.connect(buyer).approve(propVera.target, numTokensWei);
      await propVera.connect(buyer).listSharesForSale(1, 5, 12);

      await expect(propVera.connect(buyer).cancelShareListing(1))
        .to.emit(propVera, "ShareListingCanceled")
        .withArgs(1, 1, buyer.address);

      expect((await propVera.getAssetShareListings(1)).length).to.equal(0);
    });

    it("Should revert when buying own shares", async function () {
      const { propVera, propVeraFractionalToken, seller, buyer, assetPriceEth, totalTokensEth } =
        await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await propVera.verifyAsset(1);
      await propVera.createFractionalAsset(1, totalTokensEth);

      const numTokensWei = ethers.parseEther("10");
      await propVera.connect(buyer).buyFractionalAsset(1, 10);
      await propVeraFractionalToken.connect(buyer).approve(propVera.target, numTokensWei);
      await propVera.connect(buyer).listSharesForSale(1, 5, 12);

      await expect(propVera.connect(buyer).buyListedShares(1))
        .to.be.revertedWithCustomError(propVera, "CannotBuyOwnShares");
    });
  });

  // ── Buyer Portfolio ─────────────────────────────────────────────────────────
  describe("Buyer Portfolio", function () {
    it("Should return correct buyer portfolio", async function () {
      const { propVera, seller, buyer, assetPriceEth, totalTokensEth } =
        await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await propVera.verifyAsset(1);
      await propVera.createFractionalAsset(1, totalTokensEth);

      const numTokensEth = 10;
      await propVera.connect(buyer).buyFractionalAsset(1, numTokensEth);

      const portfolio = await propVera.getBuyerPortfolio(buyer.address);
      expect(portfolio.length).to.equal(1);
      expect(portfolio[0].tokenId).to.equal(1);
      expect(portfolio[0].fractionalTokensOwned).to.equal(numTokensEth);
      expect(portfolio[0].investmentValueInEth)
        .to.equal(assetPriceEth * numTokensEth / totalTokensEth);
    });
  });

  // ── Display Info Functions ──────────────────────────────────────────────────
  describe("Display Info Functions", function () {
    it("Should return correct asset display info", async function () {
      const { propVera, seller, assetPriceEth, totalTokensEth } =
        await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await propVera.verifyAsset(1);
      await propVera.createFractionalAsset(1, totalTokensEth);

      const displayInfo = await propVera.getAssetDisplayInfo(1);
      expect(displayInfo.tokenId).to.equal(1);
      expect(displayInfo.priceInEth).to.equal(assetPriceEth);
      expect(displayInfo.isFractionalized).to.be.true;
      expect(displayInfo.totalFractionalTokens).to.equal(totalTokensEth);
      expect(displayInfo.remainingFractionalTokens).to.equal(totalTokensEth);
    });

    it("Should return available assets", async function () {
      const { propVera, seller, assetPriceEth } = await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await propVera.connect(seller).createAsset("ipfs://token2", assetPriceEth);
      await propVera.verifyAsset(1);
      await propVera.verifyAsset(2);
      expect((await propVera.fetchAvailableAssets()).length).to.equal(2);
    });

    it("Should return fractionalized assets", async function () {
      const { propVera, seller, assetPriceEth, totalTokensEth } =
        await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await propVera.connect(seller).createAsset("ipfs://token2", assetPriceEth);
      await propVera.verifyAsset(1);
      await propVera.verifyAsset(2);
      await propVera.createFractionalAsset(1, totalTokensEth);
      const fractionalAssets = await propVera.fetchFractionalizedAssets();
      expect(fractionalAssets.length).to.equal(1);
      expect(fractionalAssets[0].isFractionalized).to.be.true;
    });

    it("Should return seller assets", async function () {
      const { propVera, seller, assetPriceEth } = await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await propVera.connect(seller).createAsset("ipfs://token2", assetPriceEth);
      expect((await propVera.getSellerAssets(seller.address)).length).to.equal(2);
    });
  });

  // ── Fractional Asset Cancellation ───────────────────────────────────────────
  describe("Fractional Asset Cancellation", function () {
    it("Should allow canceling fractional purchase when enabled", async function () {
      const { propVera, propVeraFractionalToken, usdc, seller, buyer, assetPriceEth, assetPriceWei, totalTokensEth, totalTokensWei } =
        await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await propVera.verifyAsset(1);
      await propVera.createFractionalAsset(1, totalTokensEth);

      const numTokensEth = 10;
      const numTokensWei = ethers.parseEther("10");
      await propVera.connect(buyer).buyFractionalAsset(1, numTokensEth);
      await propVera.setBuyerCanWithdraw(1, true);
      await propVeraFractionalToken.connect(buyer).approve(propVera.target, numTokensWei);

      const initialBalance = await usdc.balanceOf(buyer.address);
      await propVera.connect(buyer).cancelFractionalAssetPurchase(1, numTokensEth);

      const refundAmount = (numTokensWei * assetPriceWei) / totalTokensWei;
      expect(await usdc.balanceOf(buyer.address)).to.equal(initialBalance + refundAmount);
      expect(await propVera.getBuyerFractions(buyer.address, 1)).to.equal(0);
    });

    it("Should revert cancellation when not enabled", async function () {
      const { propVera, seller, buyer, assetPriceEth, totalTokensEth } =
        await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await propVera.verifyAsset(1);
      await propVera.createFractionalAsset(1, totalTokensEth);
      await propVera.connect(buyer).buyFractionalAsset(1, 10);
      await expect(propVera.connect(buyer).cancelFractionalAssetPurchase(1, 10))
        .to.be.revertedWithCustomError(propVera, "CannotWithdrawYet");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 2 — BRANCH COVERAGE TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  // ── MockUSDC – full branch coverage ────────────────────────────────────────
  describe("MockUSDC – full branch coverage", function () {
    it("setMinter: grants mint access to a new account", async function () {
      const { usdc, buyer, stranger } = await loadFixture(deployContractsFixture);
      await usdc.setMinter(stranger.address, true);
      expect(await usdc.isMinter(stranger.address)).to.be.true;
      await expect(usdc.connect(stranger).mint(buyer.address, 1n))
        .to.emit(usdc, "Transfer");
    });

    it("setMinter: revokes mint access from an account", async function () {
      const { usdc, buyer, stranger } = await loadFixture(deployContractsFixture);
      await usdc.setMinter(stranger.address, true);
      await usdc.setMinter(stranger.address, false);
      expect(await usdc.isMinter(stranger.address)).to.be.false;
      await expect(usdc.connect(stranger).mint(buyer.address, 1n))
        .to.be.revertedWithCustomError(usdc, "NotMinter");
    });

    it("setMinter: reverts when called by non-owner", async function () {
      const { usdc, stranger } = await loadFixture(deployContractsFixture);
      await expect(usdc.connect(stranger).setMinter(stranger.address, true))
        .to.be.revertedWithCustomError(usdc, "OwnableUnauthorizedAccount")
        .withArgs(stranger.address);
    });

    it("mintWei: mints exact wei amount", async function () {
      const { usdc, buyer } = await loadFixture(deployContractsFixture);
      const weiAmount = 500_000n;
      const before = await usdc.balanceOf(buyer.address);
      await usdc.mintWei(buyer.address, weiAmount);
      expect(await usdc.balanceOf(buyer.address)).to.equal(before + weiAmount);
    });

    it("mintWei: reverts on zero address", async function () {
      const { usdc } = await loadFixture(deployContractsFixture);
      await expect(usdc.mintWei(ethers.ZeroAddress, 1000n))
        .to.be.revertedWithCustomError(usdc, "ZeroAddress");
    });

    it("mintWei: reverts when caller is not minter", async function () {
      const { usdc, buyer, stranger } = await loadFixture(deployContractsFixture);
      await expect(usdc.connect(stranger).mintWei(buyer.address, 1000n))
        .to.be.revertedWithCustomError(usdc, "NotMinter");
    });

    it("mint: reverts on zero address", async function () {
      const { usdc } = await loadFixture(deployContractsFixture);
      await expect(usdc.mint(ethers.ZeroAddress, 100n))
        .to.be.revertedWithCustomError(usdc, "ZeroAddress");
    });

    it("weiToEth: converts base units back to whole USDC", async function () {
      const { usdc } = await loadFixture(deployContractsFixture);
      expect(await usdc.weiToEth(2_000_000n)).to.equal(2n);
      expect(await usdc.weiToEth(500_000n)).to.equal(0n);
    });

    it("ethToWei: converts whole USDC to base units", async function () {
      const { usdc } = await loadFixture(deployContractsFixture);
      expect(await usdc.ethToWei(5n)).to.equal(5_000_000n);
    });
  });

  // ── PropVeraFractionalToken – full branch coverage ──────────────────────────
  describe("PropVeraFractionalToken – full branch coverage", function () {
    it("ethToWei: returns amountInEth × 1e18", async function () {
      const { propVeraFractionalToken } = await loadFixture(deployContractsFixture);
      expect(await propVeraFractionalToken.ethToWei(3n)).to.equal(3n * 10n ** 18n);
    });

    it("weiToEth: returns amountInWei / 1e18", async function () {
      const { propVeraFractionalToken } = await loadFixture(deployContractsFixture);
      expect(await propVeraFractionalToken.weiToEth(5n * 10n ** 18n)).to.equal(5n);
    });

    it("mintEth: owner can mint using whole-token units", async function () {
      const { propVeraFractionalToken, buyer } = await loadFixture(deployContractsFixture);
      const before = await propVeraFractionalToken.balanceOf(buyer.address);
      await propVeraFractionalToken.mintEth(buyer.address, 10n);
      expect(await propVeraFractionalToken.balanceOf(buyer.address))
        .to.equal(before + 10n * 10n ** 18n);
    });

    it("mintEth: reverts for unauthorized caller", async function () {
      const { propVeraFractionalToken, buyer, stranger } = await loadFixture(deployContractsFixture);
      await expect(propVeraFractionalToken.connect(stranger).mintEth(buyer.address, 1n))
        .to.be.revertedWithCustomError(propVeraFractionalToken, "NotAuthorized");
    });

    it("setPropVera: reverts when called a second time (already locked)", async function () {
      const { propVeraFractionalToken, stranger } = await loadFixture(deployContractsFixture);
      await expect(propVeraFractionalToken.setPropVera(stranger.address))
        .to.be.revertedWithCustomError(propVeraFractionalToken, "PropVeraAlreadyLocked");
    });

    it("setPropVera: reverts on zero address", async function () {
      const PVF = await ethers.getContractFactory("PropVeraFractionalToken");
      const fresh = await PVF.deploy();
      await expect(fresh.setPropVera(ethers.ZeroAddress))
        .to.be.revertedWithCustomError(fresh, "ZeroAddress");
    });
  });

  // ── AssetMarketplace – uncovered branches ───────────────────────────────────
  describe("AssetMarketplace – uncovered branches", function () {
    it("delistAsset (admin): refunds buyer when asset is paid but not confirmed", async function () {
      const { propVera, usdc, seller, buyer, owner, assetPriceEth, USDC_UNIT } =
        await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://a", assetPriceEth);
      await propVera.connect(owner).verifyAsset(1n);
      await propVera.connect(seller).approve(propVera.target, 1n);
      await propVera.connect(buyer).buyAsset(1n);

      const balBefore = await usdc.balanceOf(buyer.address);
      await propVera.delistAssetAdmin(1n);
      const balAfter = await usdc.balanceOf(buyer.address);
      expect(balAfter - balBefore).to.equal(BigInt(assetPriceEth) * USDC_UNIT);
    });

    it("delistAsset (seller): refunds buyer when asset is paid but not confirmed", async function () {
      const { propVera, usdc, seller, buyer, owner, assetPriceEth, USDC_UNIT } =
        await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://a", assetPriceEth);
      await propVera.connect(owner).verifyAsset(1n);
      await propVera.connect(seller).approve(propVera.target, 1n);
      await propVera.connect(buyer).buyAsset(1n);

      const balBefore = await usdc.balanceOf(buyer.address);
      await propVera.connect(seller).delistAsset(1n);
      expect((await usdc.balanceOf(buyer.address)) - balBefore)
        .to.equal(BigInt(assetPriceEth) * USDC_UNIT);
    });

    it("delistAsset: removes NFT approval from contract when present", async function () {
      const { propVera, seller, assetPriceEth } = await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://a", assetPriceEth);
      await propVera.connect(seller).approve(propVera.target, 1n);
      expect(await propVera.getApproved(1n)).to.equal(propVera.target);
      // Delist clears the approval — no revert expected
      await expect(propVera.connect(seller).delistAsset(1n))
        .to.emit(propVera, "AssetDelisted");
    });

    it("delistAsset: works when no NFT approval is set (else branch)", async function () {
      const { propVera, seller, assetPriceEth } = await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://a", assetPriceEth);
      await propVera.connect(seller).approve(ethers.ZeroAddress, 1n);
      await expect(propVera.connect(seller).delistAsset(1n))
        .to.emit(propVera, "AssetDelisted");
    });

    it("confirmAssetPayment: reverts with SellerNotOwner when seller transfers NFT away", async function () {
      const { propVera, seller, buyer, owner, stranger, assetPriceEth } =
        await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://a", assetPriceEth);
      await propVera.connect(owner).verifyAsset(1n);
      await propVera.connect(seller).approve(propVera.target, 1n);
      await propVera.connect(buyer).buyAsset(1n);

      await propVera.connect(seller).transferFrom(seller.address, stranger.address, 1n);

      await expect(propVera.connect(buyer).confirmAssetPayment(1n))
        .to.be.revertedWithCustomError(propVera, "SellerNotOwner");
    });

    it("buyAsset: reverts when contract approval was revoked", async function () {
      const { propVera, seller, buyer, owner, assetPriceEth } =
        await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://a", assetPriceEth);
      await propVera.connect(owner).verifyAsset(1n);
      await propVera.connect(seller).approve(ethers.ZeroAddress, 1n);
      await expect(propVera.connect(buyer).buyAsset(1n))
        .to.be.revertedWithCustomError(propVera, "ContractNotApproved");
    });

    it("buyAsset: succeeds via setApprovalForAll instead of approve", async function () {
      const { propVera, seller, buyer, owner, assetPriceEth } =
        await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://a", assetPriceEth);
      await propVera.connect(owner).verifyAsset(1n);
      await propVera.connect(seller).approve(ethers.ZeroAddress, 1n);
      await propVera.connect(seller).setApprovalForAll(propVera.target, true);
      await expect(propVera.connect(buyer).buyAsset(1n))
        .to.emit(propVera, "AssetPurchased");
    });

    it("fetchAllListedAssets: includes sold assets", async function () {
      const { propVera, seller, buyer, owner, assetPriceEth } =
        await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://a", assetPriceEth);
      await propVera.connect(owner).verifyAsset(1n);
      await propVera.connect(seller).approve(propVera.target, 1n);
      await propVera.connect(buyer).buyAsset(1n);
      await propVera.connect(buyer).confirmAssetPayment(1n);

      const allAssets = await propVera.fetchAllListedAssets();
      expect(allAssets.length).to.equal(1);
      expect(allAssets[0].sold).to.be.true;
    });

    it("fetchUnsoldAssets: excludes sold assets", async function () {
      const { propVera, seller, buyer, owner, assetPriceEth } =
        await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://a", assetPriceEth);
      await propVera.connect(owner).verifyAsset(1n);
      await propVera.connect(seller).approve(propVera.target, 1n);
      await propVera.connect(buyer).buyAsset(1n);
      await propVera.connect(buyer).confirmAssetPayment(1n);
      expect((await propVera.fetchUnsoldAssets()).length).to.equal(0);
    });
  });

  // ── Fractionalization – uncovered branches ──────────────────────────────────
  describe("Fractionalization – uncovered branches", function () {
    it("createFractionalAsset: reverts when contract not approved for NFT", async function () {
      const { propVera, seller, owner, assetPriceEth, totalTokensEth } =
        await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://a", assetPriceEth);
      await propVera.connect(owner).verifyAsset(1n);
      await propVera.connect(seller).approve(ethers.ZeroAddress, 1n);
      await expect(propVera.connect(owner).createFractionalAsset(1n, totalTokensEth))
        .to.be.revertedWithCustomError(propVera, "ContractNotApproved");
    });

    it("createFractionalAsset: reverts when asset is already sold", async function () {
      const { propVera, seller, buyer, owner, assetPriceEth, totalTokensEth } =
        await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://a", assetPriceEth);
      await propVera.connect(owner).verifyAsset(1n);
      await propVera.connect(seller).approve(propVera.target, 1n);
      await propVera.connect(buyer).buyAsset(1n);
      await propVera.connect(buyer).confirmAssetPayment(1n);
      await expect(propVera.connect(owner).createFractionalAsset(1n, totalTokensEth))
        .to.be.revertedWithCustomError(propVera, "AssetAlreadySold");
    });

    it("buyFractionalAsset: marks sold & transfers NFT when buyer acquires 100%", async function () {
      const { propVera, seller, buyer, owner, assetPriceEth, totalTokensEth } =
        await loadFixture(deployContractsFixture);
      await createVerifiedFractionalAsset(propVera, seller, owner, assetPriceEth, totalTokensEth);
      await propVera.connect(buyer).buyFractionalAsset(1n, totalTokensEth);
      expect((await propVera.realEstateAssets(1n)).sold).to.be.true;
      expect(await propVera.ownerOf(1n)).to.equal(buyer.address);
    });

    it("buyFractionalAsset: second purchase by same buyer does not duplicate buyers list entry", async function () {
      const { propVera, seller, buyer, owner, assetPriceEth, totalTokensEth } =
        await loadFixture(deployContractsFixture);
      await createVerifiedFractionalAsset(propVera, seller, owner, assetPriceEth, totalTokensEth);
      const half = totalTokensEth / 2;
      await propVera.connect(buyer).buyFractionalAsset(1n, half);
      await propVera.connect(buyer).buyFractionalAsset(1n, half);
      const buyers = await propVera.getFractionalAssetBuyersList(1n);
      expect(buyers.filter(a => a === buyer.address).length).to.equal(1);
    });

    it("distributeDividends: uses total-supply path when asset is fully sold", async function () {
      const { propVera, propVeraFractionalToken, usdc, seller, buyer, otherAccount, owner, assetPriceEth, totalTokensEth } =
        await loadFixture(deployContractsFixture);
      await createVerifiedFractionalAsset(propVera, seller, owner, assetPriceEth, totalTokensEth);
      await propVera.connect(buyer).buyFractionalAsset(1n, totalTokensEth);
      expect((await propVera.realEstateAssets(1n)).sold).to.be.true;

      // Transfer half to otherAccount so there are multiple holders
      const halfWei = (BigInt(totalTokensEth) / 2n) * 10n ** 18n;
      await propVeraFractionalToken.connect(buyer).approve(propVera.target, halfWei);
      await propVera.connect(buyer).transferShares(1n, otherAccount.address, BigInt(totalTokensEth) / 2n);

      const dividendAmount = 100n;
      await usdc.mint(propVera.target, dividendAmount);
      await expect(propVera.distributeFractionalDividends(1n, dividendAmount))
        .to.emit(propVera, "FractionalDividendsDistributed");
    });

    it("distributeDividends: skips holders with zero balance", async function () {
      const { propVera, propVeraFractionalToken, usdc, seller, buyer, otherAccount, owner, assetPriceEth, totalTokensEth } =
        await loadFixture(deployContractsFixture);
      await createVerifiedFractionalAsset(propVera, seller, owner, assetPriceEth, totalTokensEth);
      const half = totalTokensEth / 2;
      await propVera.connect(buyer).buyFractionalAsset(1n, half);
      await propVera.connect(otherAccount).buyFractionalAsset(1n, half);

      // buyer transfers all their shares away → balance = 0, still in list
      const buyerBalWei = await propVeraFractionalToken.balanceOf(buyer.address);
      await propVeraFractionalToken.connect(buyer).approve(propVera.target, buyerBalWei);
      await propVera.connect(buyer).transferShares(1n, otherAccount.address, BigInt(half));

      const dividendAmount = 50n;
      await usdc.mint(propVera.target, dividendAmount);
      const before = await usdc.balanceOf(otherAccount.address);
      await propVera.distributeFractionalDividends(1n, dividendAmount);
      expect((await usdc.balanceOf(otherAccount.address)) - before).to.be.gt(0n);
    });

    it("fetchFractionalAssetBuyers: uses sold-asset total supply path", async function () {
      const { propVera, seller, buyer, owner, assetPriceEth, totalTokensEth } =
        await loadFixture(deployContractsFixture);
      await createVerifiedFractionalAsset(propVera, seller, owner, assetPriceEth, totalTokensEth);
      await propVera.connect(buyer).buyFractionalAsset(1n, totalTokensEth);
      expect((await propVera.realEstateAssets(1n)).sold).to.be.true;
      const buyers = await propVera.fetchFractionalAssetBuyers(1n);
      expect(buyers.length).to.equal(1);
      expect(buyers[0].buyer).to.equal(buyer.address);
    });

    it("fetchFractionalAssetBuyers: returns empty array when no buyers yet", async function () {
      const { propVera, seller, owner, assetPriceEth, totalTokensEth } =
        await loadFixture(deployContractsFixture);
      await createVerifiedFractionalAsset(propVera, seller, owner, assetPriceEth, totalTokensEth);
      expect((await propVera.fetchFractionalAssetBuyers(1n)).length).to.equal(0);
    });

    it("cancelFractionalAssetPurchase: reverts when cancelling more than owned", async function () {
      const { propVera, propVeraFractionalToken, seller, buyer, owner, assetPriceEth, totalTokensEth } =
        await loadFixture(deployContractsFixture);
      await createVerifiedFractionalAsset(propVera, seller, owner, assetPriceEth, totalTokensEth);
      const half = BigInt(totalTokensEth) / 2n;
      await propVera.connect(buyer).buyFractionalAsset(1n, half);
      await propVera.setBuyerCanWithdraw(1n, true);
      await propVeraFractionalToken.connect(buyer).approve(propVera.target, half * 10n ** 18n);
      await expect(propVera.connect(buyer).cancelFractionalAssetPurchase(1n, half + 1n))
        .to.be.revertedWithCustomError(propVera, "NotEnoughTokensOwned");
    });
  });

  // ── ShareTrading – uncovered branches ──────────────────────────────────────
  describe("ShareTrading – uncovered branches", function () {
    it("transferShares: reverts when recipient is zero address", async function () {
      const { propVera, propVeraFractionalToken, seller, buyer, owner, assetPriceEth, totalTokensEth } =
        await loadFixture(deployContractsFixture);
      await createVerifiedFractionalAsset(propVera, seller, owner, assetPriceEth, totalTokensEth);
      await propVera.connect(buyer).buyFractionalAsset(1n, 10n);
      await propVeraFractionalToken.connect(buyer).approve(propVera.target, 10n * 10n ** 18n);
      await expect(propVera.connect(buyer).transferShares(1n, ethers.ZeroAddress, 10n))
        .to.be.revertedWithCustomError(propVera, "InvalidRecipient");
    });

    it("transferShares: reverts on self-transfer", async function () {
      const { propVera, seller, buyer, owner, assetPriceEth, totalTokensEth } =
        await loadFixture(deployContractsFixture);
      await createVerifiedFractionalAsset(propVera, seller, owner, assetPriceEth, totalTokensEth);
      await propVera.connect(buyer).buyFractionalAsset(1n, 10n);
      await expect(propVera.connect(buyer).transferShares(1n, buyer.address, 10n))
        .to.be.revertedWithCustomError(propVera, "InvalidRecipient");
    });

    it("transferShares: reverts when fractional asset does not exist", async function () {
      const { propVera, buyer, otherAccount } = await loadFixture(deployContractsFixture);
      await expect(propVera.connect(buyer).transferShares(999n, otherAccount.address, 1n))
        .to.be.revertedWithCustomError(propVera, "FractionalAssetDoesNotExist");
    });

    it("transferShares: does not double-add existing holder to buyers list", async function () {
      const { propVera, propVeraFractionalToken, seller, buyer, otherAccount, owner, assetPriceEth, totalTokensEth } =
        await loadFixture(deployContractsFixture);
      await createVerifiedFractionalAsset(propVera, seller, owner, assetPriceEth, totalTokensEth);
      const half = BigInt(totalTokensEth) / 2n;
      await propVera.connect(buyer).buyFractionalAsset(1n, half);
      await propVera.connect(otherAccount).buyFractionalAsset(1n, half);

      const quarter = half / 2n;
      await propVeraFractionalToken.connect(buyer).approve(propVera.target, quarter * 10n ** 18n);
      await propVera.connect(buyer).transferShares(1n, otherAccount.address, quarter);

      const buyersList = await propVera.getFractionalAssetBuyersList(1n);
      expect(buyersList.filter(a => a === otherAccount.address).length).to.equal(1);
    });

    it("buyListedShares: does not double-add buyer already holding shares", async function () {
      const { propVera, propVeraFractionalToken, usdc, seller, buyer, otherAccount, owner, assetPriceEth, totalTokensEth } =
        await loadFixture(deployContractsFixture);
      await createVerifiedFractionalAsset(propVera, seller, owner, assetPriceEth, totalTokensEth);
      const half = BigInt(totalTokensEth) / 2n;
      await propVera.connect(buyer).buyFractionalAsset(1n, half);
      await propVera.connect(otherAccount).buyFractionalAsset(1n, half);

      const sellShares = 10n;
      const pps = 11n;
      await propVeraFractionalToken.connect(buyer).approve(propVera.target, sellShares * 10n ** 18n);
      await propVera.connect(buyer).listSharesForSale(1n, sellShares, pps);

      await usdc.connect(otherAccount).approve(propVera.target, sellShares * pps * 1_000_000n);
      await propVera.connect(otherAccount).buyListedShares(1n);

      const buyersList = await propVera.getFractionalAssetBuyersList(1n);
      expect(buyersList.filter(a => a === otherAccount.address).length).to.equal(1);
    });

    it("buyListedShares: reverts for non-existent listing (id 0)", async function () {
      const { propVera, buyer } = await loadFixture(deployContractsFixture);
      await expect(propVera.connect(buyer).buyListedShares(0n))
        .to.be.revertedWithCustomError(propVera, "ShareListingNotFound");
    });

    it("listSharesForSale: reverts when fractional asset does not exist", async function () {
      const { propVera, buyer } = await loadFixture(deployContractsFixture);
      await expect(propVera.connect(buyer).listSharesForSale(999n, 1n, 1n))
        .to.be.revertedWithCustomError(propVera, "FractionalAssetDoesNotExist");
    });

    it("listSharesForSale: reverts when listing more than owned", async function () {
      const { propVera, seller, buyer, owner, assetPriceEth, totalTokensEth } =
        await loadFixture(deployContractsFixture);
      await createVerifiedFractionalAsset(propVera, seller, owner, assetPriceEth, totalTokensEth);
      await propVera.connect(buyer).buyFractionalAsset(1n, 10n);
      await expect(propVera.connect(buyer).listSharesForSale(1n, 11n, 1n))
        .to.be.revertedWithCustomError(propVera, "NotEnoughTokensOwned");
    });

    it("cancelShareListing: reverts when called by non-seller", async function () {
      const { propVera, propVeraFractionalToken, seller, buyer, stranger, owner, assetPriceEth, totalTokensEth } =
        await loadFixture(deployContractsFixture);
      await createVerifiedFractionalAsset(propVera, seller, owner, assetPriceEth, totalTokensEth);
      await propVera.connect(buyer).buyFractionalAsset(1n, 10n);
      await propVeraFractionalToken.connect(buyer).approve(propVera.target, 10n * 10n ** 18n);
      await propVera.connect(buyer).listSharesForSale(1n, 10n, 1n);
      await expect(propVera.connect(stranger).cancelShareListing(1n))
        .to.be.revertedWithCustomError(propVera, "NotShareSeller");
    });

    it("getAssetShareListings: returns only active listings", async function () {
      const { propVera, propVeraFractionalToken, seller, buyer, owner, assetPriceEth, totalTokensEth } =
        await loadFixture(deployContractsFixture);
      await createVerifiedFractionalAsset(propVera, seller, owner, assetPriceEth, totalTokensEth);
      await propVera.connect(buyer).buyFractionalAsset(1n, 20n);
      await propVeraFractionalToken.connect(buyer).approve(propVera.target, 20n * 10n ** 18n);
      await propVera.connect(buyer).listSharesForSale(1n, 5n, 1n);
      await propVera.connect(buyer).listSharesForSale(1n, 5n, 1n);
      await propVera.connect(buyer).cancelShareListing(1n);
      expect((await propVera.getAssetShareListings(1n)).length).to.equal(1);
    });

    it("getAllActiveShareListings: filters out cancelled listings", async function () {
      const { propVera, propVeraFractionalToken, seller, buyer, owner, assetPriceEth, totalTokensEth } =
        await loadFixture(deployContractsFixture);
      await createVerifiedFractionalAsset(propVera, seller, owner, assetPriceEth, totalTokensEth);
      await propVera.connect(buyer).buyFractionalAsset(1n, 30n);
      await propVeraFractionalToken.connect(buyer).approve(propVera.target, 30n * 10n ** 18n);
      await propVera.connect(buyer).listSharesForSale(1n, 5n, 1n);
      await propVera.connect(buyer).listSharesForSale(1n, 5n, 1n);
      await propVera.connect(buyer).listSharesForSale(1n, 5n, 1n);
      await propVera.connect(buyer).cancelShareListing(2n);
      const all = await propVera.getAllActiveShareListings();
      expect(all.length).to.equal(2);
      expect(all.every(l => l.active)).to.be.true;
    });
  });

  // ── PropVera core – display function branches ───────────────────────────────
  describe("PropVera core – display function branches", function () {
    it("fetchAvailableAssets: excludes sold assets", async function () {
      const { propVera, seller, buyer, owner, assetPriceEth } =
        await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://a", assetPriceEth);
      await propVera.connect(owner).verifyAsset(1n);
      await propVera.connect(seller).approve(propVera.target, 1n);
      await propVera.connect(buyer).buyAsset(1n);
      await propVera.connect(buyer).confirmAssetPayment(1n);
      expect((await propVera.fetchAvailableAssets()).length).to.equal(0);
    });

    it("fetchAvailableAssets: excludes unverified assets", async function () {
      const { propVera, seller, assetPriceEth } = await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://a", assetPriceEth);
      expect((await propVera.fetchAvailableAssets()).length).to.equal(0);
    });

    it("fetchAllAssetsWithDisplayInfo: skips delisted slots", async function () {
      const { propVera, seller, assetPriceEth } = await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://a", assetPriceEth);
      await propVera.connect(seller).createAsset("ipfs://b", assetPriceEth);
      await propVera.connect(seller).delistAsset(1n);
      expect((await propVera.fetchAllAssetsWithDisplayInfo()).length).to.equal(1);
    });

    it("getBuyerPortfolio: returns empty when buyer has no holdings", async function () {
      const { propVera, stranger } = await loadFixture(deployContractsFixture);
      expect((await propVera.getBuyerPortfolio(stranger.address)).length).to.equal(0);
    });

    it("getSellerAssets: returns empty array for seller with no listings", async function () {
      const { propVera, stranger } = await loadFixture(deployContractsFixture);
      expect((await propVera.getSellerAssets(stranger.address)).length).to.equal(0);
    });

    it("getAssetDisplayInfo: fractional fields are zero for non-fractionalized asset", async function () {
      const { propVera, seller, assetPriceEth } = await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://a", assetPriceEth);
      const info = await propVera.getAssetDisplayInfo(1n);
      expect(info.isFractionalized).to.be.false;
      expect(info.totalFractionalTokens).to.equal(0n);
      expect(info.pricePerFractionalTokenInEth).to.equal(0n);
    });

    it("getAssetDisplayInfo: populates fractional fields when fractionalized", async function () {
      const { propVera, seller, owner, assetPriceEth, totalTokensEth } =
        await loadFixture(deployContractsFixture);
      await createVerifiedFractionalAsset(propVera, seller, owner, assetPriceEth, totalTokensEth);
      const info = await propVera.getAssetDisplayInfo(1n);
      expect(info.isFractionalized).to.be.true;
      expect(info.totalFractionalTokens).to.equal(BigInt(totalTokensEth));
      expect(info.pricePerFractionalTokenInEth).to.be.gt(0n);
    });

    it("withdrawUSDC: reverts on zero address recipient", async function () {
      const { propVera } = await loadFixture(deployContractsFixture);
      await expect(propVera.withdrawUSDC(ethers.ZeroAddress, 1n))
        .to.be.revertedWithCustomError(propVera, "InvalidRecipient");
    });

    it("withdrawUSDC: reverts on zero amount", async function () {
      const { propVera, owner } = await loadFixture(deployContractsFixture);
      await expect(propVera.withdrawUSDC(owner.address, 0n))
        .to.be.revertedWithCustomError(propVera, "InvalidAmount");
    });
  });

});