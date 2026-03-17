// Import Hardhat toolbox utilities for network manipulation and fixture loading
const { time, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
// Import Hardhat chai matchers for event argument assertions
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
// Import chai expect for assertions
const { expect } = require("chai");
// Import Hardhat ethers for contract interactions
const { ethers } = require("hardhat");

// Test suite for PropVera and PropVeraFractionalToken contracts
describe("PropVera and PropVeraFractionalToken", function () {
  // Fixture to deploy contracts and set up initial state
  async function deployContractsFixture() {
    // Get test accounts: owner, seller, buyer, and otherAccount
    const [owner, seller, buyer, otherAccount] = await ethers.getSigners();

    // Deploy MockUSDC contract (6 decimals)
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();

    // Deploy PropVeraFractionalToken contract
    const PropVeraFractionalToken = await ethers.getContractFactory("PropVeraFractionalToken");
    const propVeraFractionalToken = await PropVeraFractionalToken.deploy();

    // Deploy PropVera contract, linking PropVeraFractionalToken and MockUSDC
    const PropVera = await ethers.getContractFactory("PropVera");
    const propVera = await PropVera.deploy(propVeraFractionalToken.target, usdc.target);

    // Authorize PropVera to mint tokens in PropVeraFractionalToken
    await propVeraFractionalToken.setPropVera(propVera.target);

    // Add owner as admin
    await propVera.addAdmin(owner.address);

    // Mint 1 million USDC for seller, buyer, and otherAccount (using ETH input)
    const usdcAmountEth = 1000000; // 1 million USDC in ETH
    await usdc.mint(seller.address, usdcAmountEth);
    await usdc.mint(buyer.address, usdcAmountEth);
    await usdc.mint(otherAccount.address, usdcAmountEth);

    // Convert to actual wei amount for approval (6 decimals)
    const usdcAmountWei = ethers.parseUnits("1000000", 6);
    
    // Approve PropVera to spend USDC for test accounts
    await usdc.connect(seller).approve(propVera.target, usdcAmountWei);
    await usdc.connect(buyer).approve(propVera.target, usdcAmountWei);
    await usdc.connect(otherAccount).approve(propVera.target, usdcAmountWei);

    // Define test constants (in ETH for user input, wei internally)
    const assetPriceEth = 1000; // 1000 USDC in ETH
    const assetPriceWei = ethers.parseUnits("1000", 6); // 1000 USDC in wei
    const totalTokensEth = 100; // 100 fractional tokens in ETH
    const totalTokensWei = ethers.parseEther("100"); // 100 tokens in wei (18 decimals)
    const pricePerTokenWei = assetPriceWei * ethers.parseEther("1") / totalTokensWei; // Price per token in USDC wei
    const listingFeePercentage = 3; // 3% listing fee
    const cancellationPenaltyPercentage = 1; // 1% cancellation penalty
    const shareTradingFeePercentage = 2; // 2% share trading fee
    const percentageScale = ethers.parseEther("1"); // 1e18 for percentage calculations

    // Return fixture data for tests
    return {
      propVeraFractionalToken,
      propVera,
      usdc,
      owner,
      seller,
      buyer,
      otherAccount,
      assetPriceEth,
      assetPriceWei,
      totalTokensEth,
      totalTokensWei,
      pricePerTokenWei,
      listingFeePercentage,
      cancellationPenaltyPercentage,
      shareTradingFeePercentage,
      percentageScale,
    };
  }

  // Test suite for PropVeraFractionalToken deployment
  describe("PropVeraFractionalToken Deployment", function () {
    // Test that token name and symbol are set correctly
    it("Should set the right name and symbol", async function () {
      const { propVeraFractionalToken } = await loadFixture(deployContractsFixture);
      expect(await propVeraFractionalToken.name()).to.equal("PropVeraFractionalToken");
      expect(await propVeraFractionalToken.symbol()).to.equal("PVF");
    });

    // Test that the contract owner is set correctly
    it("Should set the right owner", async function () {
      const { propVeraFractionalToken, owner } = await loadFixture(deployContractsFixture);
      expect(await propVeraFractionalToken.owner()).to.equal(owner.address);
    });

    // Test that only the owner can set the PropVera address
    it("Should allow owner to set PropVera address", async function () {
      const { propVeraFractionalToken, propVera, otherAccount } = await loadFixture(deployContractsFixture);
      // Non-owner should be reverted
      await expect(propVeraFractionalToken.connect(otherAccount).setPropVera(otherAccount.address)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
      // Owner should succeed
      await propVeraFractionalToken.setPropVera(propVera.target);
      expect(await propVeraFractionalToken.propVera()).to.equal(propVera.target);
    });

    // Test authorized minting by owner and PropVera, and unauthorized minting
    it("Should allow authorized minting", async function () {
      const { propVeraFractionalToken, propVera, owner, seller, buyer, totalTokensEth, assetPriceEth } = await loadFixture(deployContractsFixture);
      const amount = ethers.parseEther("100");

      // Owner can mint tokens
      await propVeraFractionalToken.mint(buyer.address, amount);
      expect(await propVeraFractionalToken.balanceOf(buyer.address)).to.equal(amount);

      // PropVera can mint via fractionalization (tokens are minted in wei internally)
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await propVera.verifyAsset(1);
      await propVera.createFractionalAsset(1, totalTokensEth);
      expect(await propVeraFractionalToken.balanceOf(propVera.target)).to.equal(ethers.parseEther(totalTokensEth.toString()));

      // Non-authorized account cannot mint
      await expect(propVeraFractionalToken.connect(buyer).mint(buyer.address, amount)).to.be.revertedWithCustomError(
        propVeraFractionalToken,
        "NotAuthorized"
      );
    });
  });

  // Test suite for PropVera deployment
  describe("PropVera Deployment", function () {
    // Test that the contract owner is set correctly
    it("Should set the right owner", async function () {
      const { propVera, owner } = await loadFixture(deployContractsFixture);
      expect(await propVera.owner()).to.equal(owner.address);
    });

    // Test that token contract addresses are set correctly
    it("Should set the correct token contracts", async function () {
      const { propVera, propVeraFractionalToken, usdc } = await loadFixture(deployContractsFixture);
      expect(await propVera.realEstateToken()).to.equal(propVeraFractionalToken.target);
      expect(await propVera.usdcToken()).to.equal(usdc.target);
    });
  });

  // Test suite for seller registration
  describe("Seller Registration", function () {
    // Test that a seller can register
    it("Should allow seller to register", async function () {
      const { propVera, seller } = await loadFixture(deployContractsFixture);

      // Register seller and verify event
      await expect(propVera.connect(seller).registerSeller())
        .to.emit(propVera, "SellerRegistered")
        .withArgs(seller.address);

      // Verify seller is registered
      expect(await propVera.sellers(seller.address)).to.be.true;
    });

    // Test that a registered seller cannot register again
    it("Should revert if seller is already registered", async function () {
      const { propVera, seller } = await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await expect(propVera.connect(seller).registerSeller()).to.be.revertedWithCustomError(
        propVera,
        "SellerAlreadyRegistered"
      );
    });
  });

  // Test suite for asset creation
  describe("Asset Creation", function () {
    // Test that a registered seller can create an asset
    it("Should allow registered seller to create an asset", async function () {
      const { propVera, seller, assetPriceEth } = await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();

      const tokenURI = "ipfs://token1";

      // Create asset and verify event (price in ETH)
      await expect(propVera.connect(seller).createAsset(tokenURI, assetPriceEth))
        .to.emit(propVera, "AssetCreated")
        .withArgs(1, assetPriceEth, seller.address, false);

      // Verify asset data (returned in ETH)
      const asset = await propVera.fetchAsset(1);
      expect(asset.tokenId).to.equal(1);
      expect(asset.price).to.equal(assetPriceEth);
      expect(asset.seller).to.equal(seller.address);
      expect(asset.sold).to.be.false;
      expect(asset.verified).to.be.false;
    });

    // Test that an unregistered seller cannot create an asset
    it("Should revert if seller is not registered", async function () {
      const { propVera, seller, assetPriceEth } = await loadFixture(deployContractsFixture);
      await expect(
        propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth)
      ).to.be.revertedWithCustomError(propVera, "SellerNotRegistered");
    });

    // Test that an asset cannot have a zero price
    it("Should revert if price is zero", async function () {
      const { propVera, seller } = await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await expect(
        propVera.connect(seller).createAsset("ipfs://token1", 0)
      ).to.be.revertedWithCustomError(propVera, "InvalidPrice");
    });
  });

  // Test suite for asset verification
  describe("Asset Verification", function () {
    // Test that an admin can verify an asset
    it("Should allow admin to verify an asset", async function () {
      const { propVera, owner, seller, assetPriceEth } = await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);

      // Verify asset and check event
      await expect(propVera.verifyAsset(1))
        .to.emit(propVera, "AssetVerified")
        .withArgs(1, seller.address);

      // Verify asset state
      const asset = await propVera.fetchAsset(1);
      expect(asset.verified).to.be.true;
    });

    // Test that verifying a non-existent asset reverts
    it("Should revert if asset does not exist", async function () {
      const { propVera } = await loadFixture(deployContractsFixture);
      await expect(propVera.verifyAsset(1)).to.be.revertedWithCustomError(propVera, "AssetDoesNotExist");
    });

    // Test that verifying an already verified asset reverts
    it("Should revert if asset is already verified", async function () {
      const { propVera, seller, assetPriceEth } = await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await propVera.verifyAsset(1);
      await expect(propVera.verifyAsset(1)).to.be.revertedWithCustomError(propVera, "AssetAlreadyVerified");
    });

    // Test that non-admin cannot verify assets
    it("Should revert if non-admin tries to verify asset", async function () {
      const { propVera, seller, buyer, assetPriceEth } = await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      
      await expect(propVera.connect(buyer).verifyAsset(1))
        .to.be.revertedWithCustomError(propVera, "NotAdmin");
    });
  });

  // Test suite for asset fractionalization
  describe("Fractionalization", function () {
    // Test that an admin can fractionalize a verified asset
    it("Should allow admin to fractionalize a verified asset", async function () {
      const { propVera, seller, totalTokensEth, assetPriceEth, assetPriceWei, totalTokensWei } = await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await propVera.verifyAsset(1);

      // Calculate expected price per token in ETH
      const pricePerTokenEth = assetPriceEth / totalTokensEth;

      // Create fractional asset and verify event (values in ETH)
      await expect(propVera.createFractionalAsset(1, totalTokensEth))
        .to.emit(propVera, "FractionalAssetCreated")
        .withArgs(1, totalTokensEth, pricePerTokenEth, seller.address);

      // Verify fractional asset data (stored in wei internally)
      const fractionalAsset = await propVera.fractionalAssets(1);
      expect(fractionalAsset.totalTokens).to.equal(totalTokensWei);
      expect(fractionalAsset.pricePerToken).to.equal(assetPriceWei * ethers.parseEther("1") / totalTokensWei);
    });

    // Test that fractionalizing an unverified asset reverts
    it("Should revert if asset is not verified", async function () {
      const { propVera, seller, totalTokensEth, assetPriceEth } = await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await expect(propVera.createFractionalAsset(1, totalTokensEth)).to.be.revertedWithCustomError(
        propVera,
        "AssetNotVerified"
      );
    });
  });

  // Test suite for fractional asset purchases
  describe("Fractional Purchases", function () {
    // Test that a buyer can purchase fractional tokens
    it("Should allow buyer to purchase fractional tokens", async function () {
      const { propVera, propVeraFractionalToken, usdc, seller, buyer, totalTokensEth, assetPriceEth, assetPriceWei } =
        await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await propVera.verifyAsset(1);
      await propVera.createFractionalAsset(1, totalTokensEth);

      const numTokensEth = 10; // 10 tokens in ETH
      const numTokensWei = ethers.parseEther("10"); // 10 tokens in wei
      const totalPriceWei = (numTokensWei * assetPriceWei) / ethers.parseEther(totalTokensEth.toString()); // USDC wei
      const totalPriceEth = assetPriceEth * numTokensEth / totalTokensEth; // For event

      // Purchase fractional tokens and verify event (values in ETH)
      await expect(propVera.connect(buyer).buyFractionalAsset(1, numTokensEth))
        .to.emit(propVera, "FractionalAssetPurchased")
        .withArgs(1, buyer.address, numTokensEth, totalPriceEth);

      // Verify token and USDC balances (tokens in wei, USDC in wei)
      expect(await propVeraFractionalToken.balanceOf(buyer.address)).to.equal(numTokensWei);
      expect(await usdc.balanceOf(propVera.target)).to.equal(totalPriceWei);
      expect(await propVera.getFractionalPayments(1)).to.equal(totalPriceEth);
    });

    // Test that purchasing more tokens than available reverts
    it("Should revert if insufficient tokens", async function () {
      const { propVera, seller, buyer, totalTokensEth, assetPriceEth } = await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await propVera.verifyAsset(1);
      await propVera.createFractionalAsset(1, totalTokensEth);

      await expect(propVera.connect(buyer).buyFractionalAsset(1, totalTokensEth + 1)).to.be.revertedWithCustomError(
        propVera,
        "InsufficientTokens"
      );
    });
  });

  // Test suite for dividend distribution to fractional buyers
  describe("Dividend Distribution", function () {
    // Test that dividends are distributed correctly to fractional buyers
    it("Should distribute dividends to fractional buyers", async function () {
      const { propVera, usdc, seller, buyer, totalTokensEth, assetPriceEth, assetPriceWei, totalTokensWei } = await loadFixture(
        deployContractsFixture
      );
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await propVera.verifyAsset(1);
      await propVera.createFractionalAsset(1, totalTokensEth);

      // Buyer purchases 10 fractional tokens (in ETH)
      const numTokensEth = 10;
      const numTokensWei = ethers.parseEther("10");
      await propVera.connect(buyer).buyFractionalAsset(1, numTokensEth);

      // Deposit 100 USDC for dividends (using ETH input)
      const dividendAmountEth = 100; // 100 USDC in ETH
      const dividendAmountWei = ethers.parseUnits("100", 6); // 100 USDC in wei
      await usdc.mint(propVera.target, dividendAmountEth);

      // Calculate expected dividend share (10/100 * 100 USDC = 10 USDC)
      const expectedShareWei = (dividendAmountWei * numTokensWei) / totalTokensWei;
      const expectedShareEth = dividendAmountEth * numTokensEth / totalTokensEth;

      // Distribute dividends and verify event (amounts in ETH)
      await expect(propVera.distributeFractionalDividends(1, dividendAmountEth))
        .to.emit(propVera, "FractionalDividendsDistributed")
        .withArgs(1, dividendAmountEth, [buyer.address], [expectedShareEth]);

      // Verify buyer's USDC balance
      const purchaseCost = (numTokensWei * assetPriceWei) / totalTokensWei;
      const initialBalance = ethers.parseUnits("1000000", 6);
      expect(await usdc.balanceOf(buyer.address)).to.equal(initialBalance - purchaseCost + expectedShareWei);
    });

    // Test that distributing dividends with insufficient USDC reverts
    it("Should revert if insufficient USDC balance", async function () {
      const { propVera, seller, totalTokensEth, assetPriceEth } = await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await propVera.verifyAsset(1);
      await propVera.createFractionalAsset(1, totalTokensEth);

      await expect(propVera.distributeFractionalDividends(1, 100)).to.be.revertedWithCustomError(
        propVera,
        "InsufficientUSDCBalance"
      );
    });
  });

  // Test suite for full asset purchases
  describe("Asset Purchase", function () {
    // Test that a buyer can purchase and confirm payment for an asset
    it("Should allow buyer to purchase an asset", async function () {
      const { propVera, usdc, seller, buyer, assetPriceEth, assetPriceWei, listingFeePercentage } = await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await propVera.verifyAsset(1);

      // Purchase asset and verify event (price in ETH)
      await expect(propVera.connect(buyer).buyAsset(1))
        .to.emit(propVera, "AssetPurchased")
        .withArgs(1, buyer.address, assetPriceEth);

      // Confirm payment and verify event
      await expect(propVera.connect(buyer).confirmAssetPayment(1))
        .to.emit(propVera, "AssetPaymentConfirmed")
        .withArgs(1, buyer.address);

      // Calculate listing fee (3% of 1000 USDC = 30 USDC)
      const listingFee = (assetPriceWei * BigInt(listingFeePercentage)) / BigInt(100);
      const initialSellerBalance = ethers.parseUnits("1000000", 6);

      // Verify seller receives payment minus fee
      expect(await usdc.balanceOf(seller.address)).to.equal(initialSellerBalance + (assetPriceWei - listingFee));
      // Verify buyer owns the asset
      expect(await propVera.ownerOf(1)).to.equal(buyer.address);
    });

    // Test that fractional payments are tracked correctly
    it("Should track fractional payments correctly", async function () {
      const { propVera, seller, buyer, assetPriceEth, totalTokensEth } = await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await propVera.verifyAsset(1);
      await propVera.createFractionalAsset(1, totalTokensEth);
      
      const numTokensEth = 10;
      const totalPriceEth = (assetPriceEth * numTokensEth) / totalTokensEth; // 100 USDC
      
      await propVera.connect(buyer).buyFractionalAsset(1, numTokensEth);
      expect(await propVera.getFractionalPayments(1)).to.equal(totalPriceEth);
    });

    // Test that purchasing an unverified asset reverts
    it("Should revert if asset is not verified", async function () {
      const { propVera, seller, buyer, assetPriceEth } = await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await expect(propVera.connect(buyer).buyAsset(1)).to.be.revertedWithCustomError(propVera, "AssetNotVerified");
    });
  });

  // Test suite for asset delisting
  describe("Delisting", function () {
    // Test that an admin can delist an asset
    it("Should allow admin to delist an asset", async function () {
      const { propVera, seller, assetPriceEth } = await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);

      // Delist asset and verify event
      await expect(propVera.delistAssetAdmin(1))
        .to.emit(propVera, "AssetDelisted")
        .withArgs(1, seller.address);

      // Verify asset is removed
      const asset = await propVera.fetchAsset(1);
      expect(asset.seller).to.equal(ethers.ZeroAddress);
    });

    // Test that delisting an asset with fractional buyers reverts
    it("Should revert if asset has fractional buyers", async function () {
      const { propVera, seller, buyer, totalTokensEth, assetPriceEth } = await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await propVera.verifyAsset(1);
      await propVera.createFractionalAsset(1, totalTokensEth);
      await propVera.connect(buyer).buyFractionalAsset(1, 10);

      await expect(propVera.delistAssetAdmin(1)).to.be.revertedWithCustomError(propVera, "FractionalizedAssetWithBuyers");
    });
  });

  // Test suite for USDC withdrawals
  describe("Withdrawals", function () {
    // Test that the owner can withdraw USDC from fractional purchases
    it("Should allow owner to withdraw USDC", async function () {
      const { propVera, usdc, owner, seller, buyer, assetPriceEth, assetPriceWei, totalTokensEth, totalTokensWei } = await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await propVera.verifyAsset(1);
      await propVera.createFractionalAsset(1, totalTokensEth);

      const numTokensEth = 10;
      const numTokensWei = ethers.parseEther("10");
      const totalPriceEth = (assetPriceEth * numTokensEth) / totalTokensEth; // 100 USDC in ETH
      const totalPriceWei = (numTokensWei * assetPriceWei) / totalTokensWei; // 100 USDC in wei

      // Buyer purchases fractional tokens
      await propVera.connect(buyer).buyFractionalAsset(1, numTokensEth);

      // Owner withdraws USDC and verify event (amount in ETH)
      await expect(propVera.withdrawUSDC(owner.address, totalPriceEth))
        .to.emit(propVera, "USDCWithdrawn")
        .withArgs(owner.address, totalPriceEth);

      // Verify owner's USDC balance
      expect(await usdc.balanceOf(owner.address)).to.equal(totalPriceWei);
    });

    // Test that withdrawing with insufficient USDC balance reverts
    it("Should revert if insufficient USDC balance", async function () {
      const { propVera, owner } = await loadFixture(deployContractsFixture);
      await expect(propVera.withdrawUSDC(owner.address, 100)).to.be.revertedWithCustomError(
        propVera,
        "InsufficientUSDCBalance"
      );
    });
  });

  // Test suite for MockUSDC contract
  describe("MockUSDC", function () {
    // Test that MockUSDC has 6 decimals
    it("Should return correct decimals", async function () {
      const { usdc } = await loadFixture(deployContractsFixture);
      expect(await usdc.decimals()).to.equal(6);
    });

    // Test ETH to wei conversion
    it("Should convert ETH to wei correctly", async function () {
      const { usdc } = await loadFixture(deployContractsFixture);
      expect(await usdc.ethToWei(1000)).to.equal(ethers.parseUnits("1000", 6));
    });
  });

  // Test suite for asset purchase cancellation
  describe("Asset Purchase Cancellation", function () {
    // Test that a buyer can cancel an asset purchase with a penalty
    it("Should allow buyer to cancel asset purchase with penalty", async function () {
      const { propVera, usdc, seller, buyer, owner, assetPriceEth, assetPriceWei, cancellationPenaltyPercentage } = await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await propVera.verifyAsset(1);
      await propVera.connect(buyer).buyAsset(1);

      const penalty = (assetPriceWei * BigInt(cancellationPenaltyPercentage)) / BigInt(100); // 10 USDC
      const refunded = assetPriceWei - penalty; // 990 USDC
      const initialBuyerBalance = await usdc.balanceOf(buyer.address); // After buy: 999,000 USDC
      const initialOwnerBalance = await usdc.balanceOf(owner.address);

      // Cancel purchase
      await propVera.connect(buyer).cancelAssetPurchase(1);

      // Verify balances: buyer gets refunded amount, owner gets penalty
      expect(await usdc.balanceOf(buyer.address)).to.equal(initialBuyerBalance + refunded);
      expect(await usdc.balanceOf(owner.address)).to.equal(initialOwnerBalance + penalty);
    });

    // Test that only the buyer can cancel the purchase
    it("Should revert if not buyer cancels asset purchase", async function () {
      const { propVera, seller, buyer, otherAccount, assetPriceEth } = await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await propVera.verifyAsset(1);
      await propVera.connect(buyer).buyAsset(1);

      // Non-buyer should be reverted
      await expect(propVera.connect(otherAccount).cancelAssetPurchase(1)).to.be.revertedWithCustomError(
        propVera,
        "NotBuyer"
      );
    });
  });

  // Test suite for admin management
  describe("Admin Management", function () {
    it("Should allow owner to add admin", async function () {
      const { propVera, owner, otherAccount } = await loadFixture(deployContractsFixture);
      
      await propVera.addAdmin(otherAccount.address);
      expect(await propVera.isAdmin(otherAccount.address)).to.be.true;
    });

    it("Should allow owner to remove admin", async function () {
      const { propVera, owner, otherAccount } = await loadFixture(deployContractsFixture);
      
      await propVera.addAdmin(otherAccount.address);
      await propVera.removeAdmin(otherAccount.address);
      expect(await propVera.isAdmin(otherAccount.address)).to.be.false;
    });

    it("Should revert if adding existing admin", async function () {
      const { propVera, owner } = await loadFixture(deployContractsFixture);
      
      await expect(propVera.addAdmin(owner.address)).to.be.revertedWithCustomError(
        propVera,
        "AdminAlreadyExists"
      );
    });

    it("Should revert if removing non-existent admin", async function () {
      const { propVera, otherAccount } = await loadFixture(deployContractsFixture);
      
      await expect(propVera.removeAdmin(otherAccount.address)).to.be.revertedWithCustomError(
        propVera,
        "AdminDoesNotExist"
      );
    });
  });

  // Test suite for fetching listed assets
  describe("Asset Listing", function () {
    // Test that fetchAllListedAssets returns correct asset data
    it("Should return correct listed assets", async function () {
      const { propVera, seller, assetPriceEth } = await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);

      // Fetch listed assets (prices in ETH)
      const assets = await propVera.fetchAllListedAssets();
      expect(assets.length).to.equal(1);
      expect(assets[0].price).to.equal(assetPriceEth);
      expect(assets[0].seller).to.equal(seller.address);
    });

    // Test that fetchAllListedAssets returns an empty list when no assets are listed
    it("Should return empty list when no assets are listed", async function () {
      const { propVera } = await loadFixture(deployContractsFixture);
      const assets = await propVera.fetchAllListedAssets();
      expect(assets.length).to.equal(0);
    });

    // Test that fetchAllListedAssets handles multiple assets
    it("Should return multiple listed assets", async function () {
      const { propVera, seller, assetPriceEth } = await loadFixture(deployContractsFixture);
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await propVera.connect(seller).createAsset("ipfs://token2", assetPriceEth);
      const assets = await propVera.fetchAllListedAssets();
      expect(assets.length).to.equal(2);
    });
  });

  // Test suite for share transfer and trading
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
      
      // Buyer purchases tokens
      await propVera.connect(buyer).buyFractionalAsset(1, numTokensEth);

      // Approve contract to transfer tokens
      await propVeraFractionalToken.connect(buyer).approve(propVera.target, numTokensWei);

      // Transfer 5 tokens to otherAccount
      const transferAmount = 5;
      await expect(propVera.connect(buyer).transferShares(1, otherAccount.address, transferAmount))
        .to.emit(propVera, "SharesTransferred")
        .withArgs(1, buyer.address, otherAccount.address, transferAmount);

      // Verify balances (in ETH)
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
      
      // Buyer purchases tokens
      await propVera.connect(buyer).buyFractionalAsset(1, numTokensEth);

      // Approve contract to transfer tokens for listing
      await propVeraFractionalToken.connect(buyer).approve(propVera.target, numTokensWei);

      // List 5 tokens at 12 USDC each
      const listingAmount = 5;
      const pricePerShare = 12; // 12 USDC in ETH
      
      await expect(propVera.connect(buyer).listSharesForSale(1, listingAmount, pricePerShare))
        .to.emit(propVera, "SharesListed")
        .withArgs(1, 1, buyer.address, listingAmount, pricePerShare);

      // Verify listing
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
      
      // Buyer purchases tokens
      await propVera.connect(buyer).buyFractionalAsset(1, numTokensEth);

      // Approve and list shares
      await propVeraFractionalToken.connect(buyer).approve(propVera.target, numTokensWei);
      const listingAmount = 5;
      const pricePerShare = 12; // 12 USDC per share
      await propVera.connect(buyer).listSharesForSale(1, listingAmount, pricePerShare);

      // OtherAccount buys the listed shares
      const totalPrice = listingAmount * pricePerShare;
      const totalPriceWei = ethers.parseUnits(totalPrice.toString(), 6);
      const tradingFee = (totalPriceWei * BigInt(shareTradingFeePercentage)) / BigInt(100);
      const sellerPayment = totalPriceWei - tradingFee;

      const buyerInitialBalance = await usdc.balanceOf(buyer.address);

      await expect(propVera.connect(otherAccount).buyListedShares(1))
        .to.emit(propVera, "SharesPurchased")
        .withArgs(1, 1, otherAccount.address, buyer.address, listingAmount, totalPrice);

      // Verify balances
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
      
      // Buyer purchases and lists tokens
      await propVera.connect(buyer).buyFractionalAsset(1, numTokensEth);
      await propVeraFractionalToken.connect(buyer).approve(propVera.target, numTokensWei);
      await propVera.connect(buyer).listSharesForSale(1, 5, 12);

      // Cancel listing
      await expect(propVera.connect(buyer).cancelShareListing(1))
        .to.emit(propVera, "ShareListingCanceled")
        .withArgs(1, 1, buyer.address);

      // Verify listing is inactive
      const listings = await propVera.getAssetShareListings(1);
      expect(listings.length).to.equal(0);
    });

    it("Should revert when buying own shares", async function () {
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

      // Try to buy own shares
      await expect(propVera.connect(buyer).buyListedShares(1))
        .to.be.revertedWithCustomError(propVera, "CannotBuyOwnShares");
    });
  });

  // Test suite for buyer portfolio
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

      // Get portfolio
      const portfolio = await propVera.getBuyerPortfolio(buyer.address);
      expect(portfolio.length).to.equal(1);
      expect(portfolio[0].tokenId).to.equal(1);
      expect(portfolio[0].fractionalTokensOwned).to.equal(numTokensEth);
      expect(portfolio[0].investmentValueInEth).to.equal(assetPriceEth * numTokensEth / totalTokensEth);
    });
  });

  // Test suite for display info functions
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
      const { propVera, seller, assetPriceEth } = 
        await loadFixture(deployContractsFixture);
      
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await propVera.connect(seller).createAsset("ipfs://token2", assetPriceEth);
      await propVera.verifyAsset(1);
      await propVera.verifyAsset(2);

      const availableAssets = await propVera.fetchAvailableAssets();
      expect(availableAssets.length).to.equal(2);
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
      const { propVera, seller, assetPriceEth } = 
        await loadFixture(deployContractsFixture);
      
      await propVera.connect(seller).registerSeller();
      await propVera.connect(seller).createAsset("ipfs://token1", assetPriceEth);
      await propVera.connect(seller).createAsset("ipfs://token2", assetPriceEth);

      const sellerAssets = await propVera.getSellerAssets(seller.address);
      expect(sellerAssets.length).to.equal(2);
    });
  });

  // Test suite for fractional asset cancellation
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

      // Enable withdrawal
      await propVera.setBuyerCanWithdraw(1, true);

      // Approve tokens for withdrawal
      await propVeraFractionalToken.connect(buyer).approve(propVera.target, numTokensWei);

      const initialBalance = await usdc.balanceOf(buyer.address);

      // Cancel purchase
      await propVera.connect(buyer).cancelFractionalAssetPurchase(1, numTokensEth);

      // Verify refund
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

      const numTokensEth = 10;
      await propVera.connect(buyer).buyFractionalAsset(1, numTokensEth);

      // Try to cancel without enabling withdrawal
      await expect(propVera.connect(buyer).cancelFractionalAssetPurchase(1, numTokensEth))
        .to.be.revertedWithCustomError(propVera, "CannotWithdrawYet");
    });
  });
});