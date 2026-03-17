/*
// Import Hardhat toolbox utilities for network manipulation and fixture loading
const { time, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
// Import Hardhat chai matchers for event argument assertions
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
// Import chai expect for assertions
const { expect } = require("chai");
// Import Hardhat ethers for contract interactions
const { ethers } = require("hardhat");

// Test suite for BlockEstate and BlockEstateFractionalToken contracts
describe("BlockEstate and BlockEstateFractionalToken", function () {
  // Fixture to deploy contracts and set up initial state
  async function deployContractsFixture() {
    // Get test accounts: owner, seller, buyer, and otherAccount
    const [owner, seller, buyer, otherAccount] = await ethers.getSigners();

    // Deploy MockUSDC contract (6 decimals)
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();

    // Deploy BlockEstateFractionalToken contract
    const BlockEstateFractionalToken = await ethers.getContractFactory("BlockEstateFractionalToken");
    const blockEstateFractionalToken = await BlockEstateFractionalToken.deploy();

    // Deploy BlockEstate contract, linking BlockEstateFractionalToken and MockUSDC
    const BlockEstate = await ethers.getContractFactory("BlockEstate");
    const blockEstate = await BlockEstate.deploy(blockEstateFractionalToken.target, usdc.target);

    // Authorize BlockEstate to mint tokens in BlockEstateFractionalToken
    await blockEstateFractionalToken.setBlockEstate(blockEstate.target);

    // Add owner as admin
    await blockEstate.addAdmin(owner.address);

    // Mint 1 million USDC for seller, buyer, and otherAccount (6 decimals)
    const usdcAmount = ethers.parseUnits("1000000", 6); // 6 decimals
    await usdc.mint(seller.address, usdcAmount);
    await usdc.mint(buyer.address, usdcAmount);
    await usdc.mint(otherAccount.address, usdcAmount);

    // Approve BlockEstate to spend USDC for test accounts
    await usdc.connect(seller).approve(blockEstate.target, usdcAmount);
    await usdc.connect(buyer).approve(blockEstate.target, usdcAmount);
    await usdc.connect(otherAccount).approve(blockEstate.target, usdcAmount);

    // Define test constants
    const assetPrice = ethers.parseUnits("1000", 6); // 1000 USDC
    const totalTokens = 100; // 100 fractional tokens
    const pricePerToken = assetPrice / BigInt(totalTokens); // 10 USDC per token
    const listingFeePercentage = 3; // 3% listing fee
    const cancellationPenaltyPercentage = 1; // 1% cancellation penalty
    const shareTradingFeePercentage = 2; // 2% share trading fee
    const percentageScale = ethers.parseEther("1"); // 1e18 for percentage calculations

    // Return fixture data for tests
    return {
      blockEstateFractionalToken,
      blockEstate,
      usdc,
      owner,
      seller,
      buyer,
      otherAccount,
      assetPrice,
      totalTokens,
      pricePerToken,
      listingFeePercentage,
      cancellationPenaltyPercentage,
      shareTradingFeePercentage,
      percentageScale,
    };
  }

  // Test suite for BlockEstateFractionalToken deployment
  describe("BlockEstateFractionalToken Deployment", function () {
    // Test that token name and symbol are set correctly
    it("Should set the right name and symbol", async function () {
      const { blockEstateFractionalToken } = await loadFixture(deployContractsFixture);
      expect(await blockEstateFractionalToken.name()).to.equal("BlockEstateFractionalToken");
      expect(await blockEstateFractionalToken.symbol()).to.equal("BFT");
    });

    // Test that the contract owner is set correctly
    it("Should set the right owner", async function () {
      const { blockEstateFractionalToken, owner } = await loadFixture(deployContractsFixture);
      expect(await blockEstateFractionalToken.owner()).to.equal(owner.address);
    });

    // Test that only the owner can set the BlockEstate address
    it("Should allow owner to set BlockEstate address", async function () {
      const { blockEstateFractionalToken, blockEstate, otherAccount } = await loadFixture(deployContractsFixture);
      // Non-owner should be reverted
      await expect(blockEstateFractionalToken.connect(otherAccount).setBlockEstate(otherAccount.address)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
      // Owner should succeed
      await blockEstateFractionalToken.setBlockEstate(blockEstate.target);
      expect(await blockEstateFractionalToken.blockEstate()).to.equal(blockEstate.target);
    });

    // Test authorized minting by owner and BlockEstate, and unauthorized minting
    it("Should allow authorized minting", async function () {
      const { blockEstateFractionalToken, blockEstate, owner, seller, buyer, totalTokens, assetPrice } = await loadFixture(deployContractsFixture);
      const amount = ethers.parseEther("100");

      // Owner can mint tokens
      await blockEstateFractionalToken.mint(buyer.address, amount);
      expect(await blockEstateFractionalToken.balanceOf(buyer.address)).to.equal(amount);

      // BlockEstate can mint via fractionalization
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);
      await blockEstate.verifyAsset(1);
      await blockEstate.createFractionalAsset(1, totalTokens);
      expect(await blockEstateFractionalToken.balanceOf(blockEstate.target)).to.equal(totalTokens);

      // Non-authorized account cannot mint
      await expect(blockEstateFractionalToken.connect(buyer).mint(buyer.address, amount)).to.be.revertedWithCustomError(
        blockEstateFractionalToken,
        "NotAuthorized"
      );
    });
  });

  // Test suite for BlockEstate deployment
  describe("BlockEstate Deployment", function () {
    // Test that the contract owner is set correctly
    it("Should set the right owner", async function () {
      const { blockEstate, owner } = await loadFixture(deployContractsFixture);
      expect(await blockEstate.owner()).to.equal(owner.address);
    });

    // Test that token contract addresses are set correctly
    it("Should set the correct token contracts", async function () {
      const { blockEstate, blockEstateFractionalToken, usdc } = await loadFixture(deployContractsFixture);
      expect(await blockEstate.realEstateToken()).to.equal(blockEstateFractionalToken.target);
      expect(await blockEstate.usdcToken()).to.equal(usdc.target);
    });
  });

  // Test suite for seller registration
  describe("Seller Registration", function () {
    // Test that a seller can register
    it("Should allow seller to register", async function () {
      const { blockEstate, seller } = await loadFixture(deployContractsFixture);

      // Register seller and verify event
      await expect(blockEstate.connect(seller).registerSeller())
        .to.emit(blockEstate, "SellerRegistered")
        .withArgs(seller.address);

      // Verify seller is registered
      expect(await blockEstate.sellers(seller.address)).to.be.true;
    });

    // Test that a registered seller cannot register again
    it("Should revert if seller is already registered", async function () {
      const { blockEstate, seller } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await expect(blockEstate.connect(seller).registerSeller()).to.be.revertedWithCustomError(
        blockEstate,
        "SellerAlreadyRegistered"
      );
    });
  });

  // Test suite for asset creation
  describe("Asset Creation", function () {
    // Test that a registered seller can create an asset
    it("Should allow registered seller to create an asset", async function () {
      const { blockEstate, seller, assetPrice } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();

      const tokenURI = "ipfs://token1";

      // Create asset and verify event
      await expect(blockEstate.connect(seller).createAsset(tokenURI, assetPrice))
        .to.emit(blockEstate, "AssetCreated")
        .withArgs(1, assetPrice, seller.address, false);

      // Verify asset data
      const asset = await blockEstate.fetchAsset(1);
      expect(asset.tokenId).to.equal(1);
      expect(asset.price).to.equal(assetPrice);
      expect(asset.seller).to.equal(seller.address);
      expect(asset.sold).to.be.false;
      expect(asset.verified).to.be.false;
    });

    // Test that an unregistered seller cannot create an asset
    it("Should revert if seller is not registered", async function () {
      const { blockEstate, seller, assetPrice } = await loadFixture(deployContractsFixture);
      await expect(
        blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice)
      ).to.be.revertedWithCustomError(blockEstate, "SellerNotRegistered");
    });

    // Test that an asset cannot have a zero price
    it("Should revert if price is zero", async function () {
      const { blockEstate, seller } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await expect(
        blockEstate.connect(seller).createAsset("ipfs://token1", 0)
      ).to.be.revertedWithCustomError(blockEstate, "InvalidPrice");
    });
  });

  // Test suite for asset verification
  describe("Asset Verification", function () {
    // Test that an admin can verify an asset
    it("Should allow admin to verify an asset", async function () {
      const { blockEstate, owner, seller, assetPrice } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);

      // Verify asset and check event
      await expect(blockEstate.verifyAsset(1))
        .to.emit(blockEstate, "AssetVerified")
        .withArgs(1, seller.address);

      // Verify asset state
      const asset = await blockEstate.fetchAsset(1);
      expect(asset.verified).to.be.true;
    });

    // Test that verifying a non-existent asset reverts
    it("Should revert if asset does not exist", async function () {
      const { blockEstate } = await loadFixture(deployContractsFixture);
      await expect(blockEstate.verifyAsset(1)).to.be.revertedWithCustomError(blockEstate, "AssetDoesNotExist");
    });

    // Test that verifying an already verified asset reverts
    it("Should revert if asset is already verified", async function () {
      const { blockEstate, seller, assetPrice } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);
      await blockEstate.verifyAsset(1);
      await expect(blockEstate.verifyAsset(1)).to.be.revertedWithCustomError(blockEstate, "AssetAlreadyVerified");
    });

    // Test that non-admin cannot verify assets
    it("Should revert if non-admin tries to verify asset", async function () {
      const { blockEstate, seller, buyer, assetPrice } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);
      
      await expect(blockEstate.connect(buyer).verifyAsset(1))
        .to.be.revertedWithCustomError(blockEstate, "NotAdmin");
    });
  });

  // Test suite for asset fractionalization
  describe("Fractionalization", function () {
    // Test that an admin can fractionalize a verified asset
    it("Should allow admin to fractionalize a verified asset", async function () {
      const { blockEstate, seller, totalTokens, assetPrice, pricePerToken } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);
      await blockEstate.verifyAsset(1);

      // Create fractional asset and verify event
      await expect(blockEstate.createFractionalAsset(1, totalTokens))
        .to.emit(blockEstate, "FractionalAssetCreated")
        .withArgs(1, totalTokens, pricePerToken, seller.address);

      // Verify fractional asset data
      const fractionalAsset = await blockEstate.fractionalAssets(1);
      expect(fractionalAsset.totalTokens).to.equal(totalTokens);
      expect(fractionalAsset.pricePerToken).to.equal(pricePerToken);
    });

    // Test that fractionalizing an unverified asset reverts
    it("Should revert if asset is not verified", async function () {
      const { blockEstate, seller, totalTokens, assetPrice } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);
      await expect(blockEstate.createFractionalAsset(1, totalTokens)).to.be.revertedWithCustomError(
        blockEstate,
        "AssetNotVerified"
      );
    });
  });

  // Test suite for fractional asset purchases
  describe("Fractional Purchases", function () {
    // Test that a buyer can purchase fractional tokens
    it("Should allow buyer to purchase fractional tokens", async function () {
      const { blockEstate, blockEstateFractionalToken, usdc, seller, buyer, totalTokens, assetPrice, pricePerToken } =
        await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);
      await blockEstate.verifyAsset(1);
      await blockEstate.createFractionalAsset(1, totalTokens);

      const numTokens = 10;
      const totalPrice = pricePerToken * BigInt(numTokens); // 100 USDC

      // Purchase fractional tokens and verify event
      await expect(blockEstate.connect(buyer).buyFractionalAsset(1, numTokens))
        .to.emit(blockEstate, "FractionalAssetPurchased")
        .withArgs(1, buyer.address, numTokens, totalPrice);

      // Verify token and USDC balances
      expect(await blockEstateFractionalToken.balanceOf(buyer.address)).to.equal(numTokens);
      expect(await usdc.balanceOf(blockEstate.target)).to.equal(totalPrice);
      expect(await blockEstate.getFractionalPayments(1)).to.equal(totalPrice);
    });

    // Test that purchasing more tokens than available reverts
    it("Should revert if insufficient tokens", async function () {
      const { blockEstate, seller, buyer, totalTokens, assetPrice } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);
      await blockEstate.verifyAsset(1);
      await blockEstate.createFractionalAsset(1, totalTokens);

      await expect(blockEstate.connect(buyer).buyFractionalAsset(1, totalTokens + 1)).to.be.revertedWithCustomError(
        blockEstate,
        "InsufficientTokens"
      );
    });
  });

  // Test suite for dividend distribution to fractional buyers
  describe("Dividend Distribution", function () {
    // Test that dividends are distributed correctly to fractional buyers
    it("Should distribute dividends to fractional buyers", async function () {
      const { blockEstate, usdc, seller, buyer, totalTokens, assetPrice, pricePerToken } = await loadFixture(
        deployContractsFixture
      );
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);
      await blockEstate.verifyAsset(1);
      await blockEstate.createFractionalAsset(1, totalTokens);

      // Buyer purchases 10 fractional tokens
      const numTokens = 10;
      await blockEstate.connect(buyer).buyFractionalAsset(1, numTokens);

      // Deposit 100 USDC for dividends
      const dividendAmount = ethers.parseUnits("100", 6); // 100 USDC
      await usdc.mint(blockEstate.target, dividendAmount);

      // Calculate expected dividend share (10/100 * 100 USDC = 10 USDC)
      const expectedShare = (dividendAmount * BigInt(numTokens)) / BigInt(totalTokens);

      // Distribute dividends and verify event
      await expect(blockEstate.distributeFractionalDividends(1, dividendAmount))
        .to.emit(blockEstate, "FractionalDividendsDistributed")
        .withArgs(1, dividendAmount, [buyer.address], [expectedShare]);

      // Verify buyer's USDC balance (initial - purchase + dividend)
      expect(await usdc.balanceOf(buyer.address)).to.equal(ethers.parseUnits("1000000", 6) - pricePerToken * BigInt(numTokens) + expectedShare);
    });

    // Test that distributing dividends with insufficient USDC reverts
    it("Should revert if insufficient USDC balance", async function () {
      const { blockEstate, seller, totalTokens, assetPrice } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);
      await blockEstate.verifyAsset(1);
      await blockEstate.createFractionalAsset(1, totalTokens);

      await expect(blockEstate.distributeFractionalDividends(1, ethers.parseUnits("100", 6))).to.be.revertedWithCustomError(
        blockEstate,
        "InsufficientUSDCBalance"
      );
    });
  });

  // Test suite for full asset purchases
  describe("Asset Purchase", function () {
    // Test that a buyer can purchase and confirm payment for an asset
    it("Should allow buyer to purchase an asset", async function () {
      const { blockEstate, usdc, seller, buyer, assetPrice, listingFeePercentage } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);
      await blockEstate.verifyAsset(1);

      // Purchase asset and verify event
      await expect(blockEstate.connect(buyer).buyAsset(1))
        .to.emit(blockEstate, "AssetPurchased")
        .withArgs(1, buyer.address, assetPrice);

      // Confirm payment and verify event
      await expect(blockEstate.connect(buyer).confirmAssetPayment(1))
        .to.emit(blockEstate, "AssetPaymentConfirmed")
        .withArgs(1, buyer.address);

      // Calculate listing fee (3% of 1000 USDC = 30 USDC)
      const listingFee = (assetPrice * BigInt(listingFeePercentage)) / BigInt(100);
      const initialSellerBalance = ethers.parseUnits("1000000", 6);

      // Verify seller receives payment minus fee
      expect(await usdc.balanceOf(seller.address)).to.equal(initialSellerBalance + (assetPrice - listingFee));
      // Verify buyer owns the asset
      expect(await blockEstate.ownerOf(1)).to.equal(buyer.address);
    });

    // Test that fractional payments are tracked correctly
    it("Should track fractional payments correctly", async function () {
      const { blockEstate, seller, buyer, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);
      await blockEstate.verifyAsset(1);
      await blockEstate.createFractionalAsset(1, totalTokens);
      const numTokens = 10;
      const totalPrice = (assetPrice / BigInt(totalTokens)) * BigInt(numTokens); // 100 USDC
      await blockEstate.connect(buyer).buyFractionalAsset(1, numTokens);
      expect(await blockEstate.getFractionalPayments(1)).to.equal(totalPrice);
    });

    // Test that purchasing an unverified asset reverts
    it("Should revert if asset is not verified", async function () {
      const { blockEstate, seller, buyer, assetPrice } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);
      await expect(blockEstate.connect(buyer).buyAsset(1)).to.be.revertedWithCustomError(blockEstate, "AssetNotVerified");
    });
  });

  // Test suite for asset delisting
  describe("Delisting", function () {
    // Test that an admin can delist an asset
    it("Should allow admin to delist an asset", async function () {
      const { blockEstate, seller, assetPrice } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);

      // Delist asset and verify event
      await expect(blockEstate.delistAsset(1))
        .to.emit(blockEstate, "AssetDelisted")
        .withArgs(1, seller.address);

      // Verify asset is removed
      const asset = await blockEstate.fetchAsset(1);
      expect(asset.seller).to.equal(ethers.ZeroAddress);
    });

    // Test that delisting an asset with fractional buyers reverts
    it("Should revert if asset has fractional buyers", async function () {
      const { blockEstate, seller, buyer, totalTokens, assetPrice } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);
      await blockEstate.verifyAsset(1);
      await blockEstate.createFractionalAsset(1, totalTokens);
      await blockEstate.connect(buyer).buyFractionalAsset(1, 10);

      await expect(blockEstate.delistAsset(1)).to.be.revertedWithCustomError(blockEstate, "FractionalizedAssetWithBuyers");
    });
  });

  // Test suite for USDC withdrawals
  describe("Withdrawals", function () {
    // Test that the owner can withdraw USDC from fractional purchases
    it("Should allow owner to withdraw USDC", async function () {
      const { blockEstate, usdc, owner, seller, buyer, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);
      await blockEstate.verifyAsset(1);
      await blockEstate.createFractionalAsset(1, totalTokens);

      const numTokens = 10;
      const totalPrice = (assetPrice / BigInt(totalTokens)) * BigInt(numTokens); // 100 USDC

      // Buyer purchases fractional tokens
      await blockEstate.connect(buyer).buyFractionalAsset(1, numTokens);

      // Owner withdraws USDC and verify event
      await expect(blockEstate.withdrawUSDC(owner.address, totalPrice))
        .to.emit(blockEstate, "USDCWithdrawn")
        .withArgs(owner.address, totalPrice);

      // Verify owner's USDC balance
      expect(await usdc.balanceOf(owner.address)).to.equal(totalPrice);
    });

    // Test that withdrawing with insufficient USDC balance reverts
    it("Should revert if insufficient USDC balance", async function () {
      const { blockEstate, owner } = await loadFixture(deployContractsFixture);
      await expect(blockEstate.withdrawUSDC(owner.address, ethers.parseUnits("100", 6))).to.be.revertedWithCustomError(
        blockEstate,
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
  });

  // Test suite for asset purchase cancellation
  describe("Asset Purchase Cancellation", function () {
    // Test that a buyer can cancel an asset purchase with a penalty
    it("Should allow buyer to cancel asset purchase with penalty", async function () {
      const { blockEstate, usdc, seller, buyer, owner, assetPrice, cancellationPenaltyPercentage } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);
      await blockEstate.verifyAsset(1);
      await blockEstate.connect(buyer).buyAsset(1);

      const penalty = (assetPrice * BigInt(cancellationPenaltyPercentage)) / BigInt(100); // 10 USDC
      const refunded = assetPrice - penalty; // 990 USDC
      const initialBuyerBalance = await usdc.balanceOf(buyer.address); // After buy: 999,000 USDC
      const initialOwnerBalance = await usdc.balanceOf(owner.address);

      // Cancel purchase
      await blockEstate.connect(buyer).cancelAssetPurchase(1);

      // Verify balances: buyer gets refunded amount, owner gets penalty
      expect(await usdc.balanceOf(buyer.address)).to.equal(initialBuyerBalance + refunded);
      expect(await usdc.balanceOf(owner.address)).to.equal(initialOwnerBalance + penalty);
    });

    // Test that only the buyer can cancel the purchase
    it("Should revert if not buyer cancels asset purchase", async function () {
      const { blockEstate, seller, buyer, otherAccount, assetPrice } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);
      await blockEstate.verifyAsset(1);
      await blockEstate.connect(buyer).buyAsset(1);

      // Non-buyer should be reverted
      await expect(blockEstate.connect(otherAccount).cancelAssetPurchase(1)).to.be.revertedWithCustomError(
        blockEstate,
        "NotBuyer"
      );
    });
  });

  // Test suite for admin management
  describe("Admin Management", function () {
    it("Should allow owner to add admin", async function () {
      const { blockEstate, owner, otherAccount } = await loadFixture(deployContractsFixture);
      
      await blockEstate.addAdmin(otherAccount.address);
      expect(await blockEstate.isAdmin(otherAccount.address)).to.be.true;
    });

    it("Should allow owner to remove admin", async function () {
      const { blockEstate, owner, otherAccount } = await loadFixture(deployContractsFixture);
      
      await blockEstate.addAdmin(otherAccount.address);
      await blockEstate.removeAdmin(otherAccount.address);
      expect(await blockEstate.isAdmin(otherAccount.address)).to.be.false;
    });
  });

  // Test suite for fetching listed assets
  describe("Asset Listing", function () {
    // Test that fetchAllListedAssets returns correct asset data
    it("Should return correct listed assets", async function () {
      const { blockEstate, seller, assetPrice } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);

      // Fetch listed assets
      const assets = await blockEstate.fetchAllListedAssets();
      expect(assets.length).to.equal(1);
    });
  });

  // Test suite for new getter functions
  describe("Getter Functions", function () {
    it("Should return asset display info", async function () {
      const { blockEstate, seller, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);
      await blockEstate.verifyAsset(1);
      await blockEstate.createFractionalAsset(1, totalTokens);

      const displayInfo = await blockEstate.getAssetDisplayInfo(1);
      expect(displayInfo.tokenId).to.equal(1);
      expect(displayInfo.price).to.equal(assetPrice);
      expect(displayInfo.seller).to.equal(seller.address);
      expect(displayInfo.verified).to.be.true;
      expect(displayInfo.isFractionalized).to.be.true;
      expect(displayInfo.totalFractionalTokens).to.equal(totalTokens);
    });

    it("Should fetch available assets", async function () {
      const { blockEstate, seller, assetPrice } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);
      await blockEstate.verifyAsset(1);

      const availableAssets = await blockEstate.fetchAvailableAssets();
      expect(availableAssets.length).to.equal(1);
      expect(availableAssets[0].tokenId).to.equal(1);
    });

    it("Should fetch fractionalized assets", async function () {
      const { blockEstate, seller, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);
      await blockEstate.verifyAsset(1);
      await blockEstate.createFractionalAsset(1, totalTokens);

      const fractionalAssets = await blockEstate.fetchFractionalizedAssets();
      expect(fractionalAssets.length).to.equal(1);
      expect(fractionalAssets[0].isFractionalized).to.be.true;
    });

    it("Should fetch buyer portfolio", async function () {
      const { blockEstate, seller, buyer, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);
      await blockEstate.verifyAsset(1);
      await blockEstate.createFractionalAsset(1, totalTokens);
      
      await blockEstate.connect(buyer).buyFractionalAsset(1, 10);

      const portfolio = await blockEstate.getBuyerPortfolio(buyer.address);
      expect(portfolio.length).to.equal(1);
      expect(portfolio[0].tokenId).to.equal(1);
      expect(portfolio[0].fractionalTokensOwned).to.equal(10);
    });

    it("Should fetch seller assets", async function () {
      const { blockEstate, seller, assetPrice } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);
      await blockEstate.connect(seller).createAsset("ipfs://token2", assetPrice);

      const sellerAssets = await blockEstate.getSellerAssets(seller.address);
      expect(sellerAssets.length).to.equal(2);
    });

    it("Should return seller metrics", async function () {
      const { blockEstate, seller, buyer, assetPrice } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);
      await blockEstate.verifyAsset(1);
      await blockEstate.connect(buyer).buyAsset(1);
      await blockEstate.connect(buyer).confirmAssetPayment(1);

      const [confirmed, canceled] = await blockEstate.getSellerMetrics(seller.address);
      expect(confirmed).to.equal(1);
      expect(canceled).to.equal(0);
    });

    it("Should return fractional asset buyers list", async function () {
      const { blockEstate, seller, buyer, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);
      await blockEstate.verifyAsset(1);
      await blockEstate.createFractionalAsset(1, totalTokens);
      await blockEstate.connect(buyer).buyFractionalAsset(1, 10);

      const buyers = await blockEstate.getFractionalAssetBuyersList(1);
      expect(buyers.length).to.equal(1);
      expect(buyers[0]).to.equal(buyer.address);
    });
  });

  // Test suite for fractional asset cancellation
  describe("Fractional Asset Purchase Cancellation", function () {
    it("Should allow buyer to cancel fractional purchase when enabled", async function () {
      const { blockEstate, blockEstateFractionalToken, usdc, seller, buyer, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);
      await blockEstate.verifyAsset(1);
      await blockEstate.createFractionalAsset(1, totalTokens);
      
      const numTokens = 10;
      await blockEstate.connect(buyer).buyFractionalAsset(1, numTokens);
      
      // Enable withdrawal for this asset
      await blockEstate.setBuyerCanWithdraw(1, true);
      
      const buyerBalanceBefore = await usdc.balanceOf(buyer.address);
      const pricePerToken = assetPrice / BigInt(totalTokens);
      const refundAmount = pricePerToken * BigInt(numTokens);

      // Approve tokens back to contract
      await blockEstateFractionalToken.connect(buyer).approve(blockEstate.target, 35);
      
      await blockEstate.connect(buyer).listSharesForSale(1, 10, ethers.parseUnits("12", 6));
      //await blockEstate.connect(buyer).listSharesForSale(2, 5, ethers.parseUnits("15", 6));
      
      const allListings = await blockEstate.getAllActiveShareListings();
      expect(allListings.length).to.equal(1);
    });

    it("Should not return inactive listings", async function () {
      const { blockEstate, blockEstateFractionalToken, seller, buyer, otherAccount, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);
      await blockEstate.verifyAsset(1);
      await blockEstate.createFractionalAsset(1, totalTokens);
      
      await blockEstate.connect(buyer).buyFractionalAsset(1, 30);
      await blockEstateFractionalToken.connect(buyer).approve(blockEstate.target, 30);
      await blockEstate.connect(buyer).listSharesForSale(1, 10, ethers.parseUnits("12", 6));
      
      // Cancel the listing
      await blockEstate.connect(buyer).cancelShareListing(1);
      
      const listings = await blockEstate.getAssetShareListings(1);
      expect(listings.length).to.equal(0);
    });
  
    it("Should revert if buyer cannot withdraw yet", async function () {
      const { blockEstate, seller, buyer, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);
      await blockEstate.verifyAsset(1);
      await blockEstate.createFractionalAsset(1, totalTokens);
      await blockEstate.connect(buyer).buyFractionalAsset(1, 10);

      await expect(blockEstate.connect(buyer).cancelFractionalAssetPurchase(1, 10))
        .to.be.revertedWithCustomError(blockEstate, "CannotWithdrawYet");
    });

    it("Should allow admin to set buyer withdrawal permission", async function () {
      const { blockEstate, seller, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);
      await blockEstate.verifyAsset(1);
      await blockEstate.createFractionalAsset(1, totalTokens);

      await blockEstate.setBuyerCanWithdraw(1, true);
      expect(await blockEstate.buyerCanWithdraw(1)).to.be.true;

      await blockEstate.setBuyerCanWithdraw(1, false);
      expect(await blockEstate.buyerCanWithdraw(1)).to.be.false;
    });

    it("Should revert if buyer has no tokens to cancel", async function () {
      const { blockEstate, seller, buyer, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);
      await blockEstate.verifyAsset(1);
      await blockEstate.createFractionalAsset(1, totalTokens);
      
      await blockEstate.setBuyerCanWithdraw(1, true);

      await expect(blockEstate.connect(buyer).cancelFractionalAssetPurchase(1, 10))
        .to.be.revertedWithCustomError(blockEstate, "NoTokensOwned");
    });

    it("Should revert if buyer tries to cancel more tokens than owned", async function () {
      const { blockEstate, blockEstateFractionalToken, seller, buyer, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);
      await blockEstate.verifyAsset(1);
      await blockEstate.createFractionalAsset(1, totalTokens);
      
      const numTokens = 10;
      await blockEstate.connect(buyer).buyFractionalAsset(1, numTokens);
      
      await blockEstate.setBuyerCanWithdraw(1, true);
      
      // Approve tokens back to contract
      await blockEstateFractionalToken.connect(buyer).approve(blockEstate.target, numTokens + 5);
      
      await expect(blockEstate.connect(buyer).cancelFractionalAssetPurchase(1, numTokens + 5))
        .to.be.revertedWithCustomError(blockEstate, "NotEnoughTokensOwned");
    });
  });

  // Test suite for share transfer functionality
  describe("Share Transfer", function () {
    it("Should allow user to transfer shares to another address", async function () {
      const { blockEstate, blockEstateFractionalToken, seller, buyer, otherAccount, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);
      await blockEstate.verifyAsset(1);
      await blockEstate.createFractionalAsset(1, totalTokens);
      
      const numTokens = 20;
      await blockEstate.connect(buyer).buyFractionalAsset(1, numTokens);
      
      // Approve transfer
      await blockEstateFractionalToken.connect(buyer).approve(blockEstate.target, numTokens);
      
      const sharesToTransfer = 10;
      await expect(blockEstate.connect(buyer).transferShares(1, otherAccount.address, sharesToTransfer))
        .to.emit(blockEstate, "SharesTransferred")
        .withArgs(1, buyer.address, otherAccount.address, sharesToTransfer);
      
      expect(await blockEstate.getBuyerFractions(buyer.address, 1)).to.equal(numTokens - sharesToTransfer);
      expect(await blockEstate.getBuyerFractions(otherAccount.address, 1)).to.equal(sharesToTransfer);
      expect(await blockEstateFractionalToken.balanceOf(otherAccount.address)).to.equal(sharesToTransfer);
    });

    it("Should revert if transferring to zero address", async function () {
      const { blockEstate, seller, buyer, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);
      await blockEstate.verifyAsset(1);
      await blockEstate.createFractionalAsset(1, totalTokens);
      await blockEstate.connect(buyer).buyFractionalAsset(1, 10);

      await expect(blockEstate.connect(buyer).transferShares(1, ethers.ZeroAddress, 5))
        .to.be.revertedWithCustomError(blockEstate, "InvalidRecipient");
    });

    it("Should revert if transferring to self", async function () {
      const { blockEstate, seller, buyer, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);
      await blockEstate.verifyAsset(1);
      await blockEstate.createFractionalAsset(1, totalTokens);
      await blockEstate.connect(buyer).buyFractionalAsset(1, 10);

      await expect(blockEstate.connect(buyer).transferShares(1, buyer.address, 5))
        .to.be.revertedWithCustomError(blockEstate, "InvalidRecipient");
    });

    it("Should revert if transferring more shares than owned", async function () {
      const { blockEstate, seller, buyer, otherAccount, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);
      await blockEstate.verifyAsset(1);
      await blockEstate.createFractionalAsset(1, totalTokens);
      await blockEstate.connect(buyer).buyFractionalAsset(1, 10);

      await expect(blockEstate.connect(buyer).transferShares(1, otherAccount.address, 15))
        .to.be.revertedWithCustomError(blockEstate, "NotEnoughTokensOwned");
    });
  });

  // Test suite for listing shares for sale
  describe("List Shares For Sale", function () {
    it("Should allow user to list shares for sale", async function () {
      const { blockEstate, blockEstateFractionalToken, seller, buyer, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);
      await blockEstate.verifyAsset(1);
      await blockEstate.createFractionalAsset(1, totalTokens);
      
      const numTokens = 20;
      await blockEstate.connect(buyer).buyFractionalAsset(1, numTokens);
      
      // Approve transfer to contract for escrow
      await blockEstateFractionalToken.connect(buyer).approve(blockEstate.target, numTokens);
      
      const sharesToList = 10;
      const pricePerShare = ethers.parseUnits("12", 6); // 12 USDC per share
      
      await expect(blockEstate.connect(buyer).listSharesForSale(1, sharesToList, pricePerShare))
        .to.emit(blockEstate, "SharesListed")
        .withArgs(1, 1, buyer.address, sharesToList, pricePerShare);
      
      const listing = await blockEstate.shareListings(1);
      expect(listing.tokenId).to.equal(1);
      expect(listing.seller).to.equal(buyer.address);
      expect(listing.numShares).to.equal(sharesToList);
      expect(listing.pricePerShare).to.equal(pricePerShare);
      expect(listing.active).to.be.true;
      
      // Shares should be in escrow
      expect(await blockEstateFractionalToken.balanceOf(blockEstate.target)).to.equal(totalTokens - (numTokens - sharesToList));
    });

    it("Should revert if listing zero shares", async function () {
      const { blockEstate, seller, buyer, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);
      await blockEstate.verifyAsset(1);
      await blockEstate.createFractionalAsset(1, totalTokens);
      await blockEstate.connect(buyer).buyFractionalAsset(1, 10);

      await expect(blockEstate.connect(buyer).listSharesForSale(1, 0, ethers.parseUnits("10", 6)))
        .to.be.revertedWithCustomError(blockEstate, "InvalidAmount");
    });

    it("Should revert if price per share is zero", async function () {
      const { blockEstate, seller, buyer, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);
      await blockEstate.verifyAsset(1);
      await blockEstate.createFractionalAsset(1, totalTokens);
      await blockEstate.connect(buyer).buyFractionalAsset(1, 10);

      await expect(blockEstate.connect(buyer).listSharesForSale(1, 5, 0))
        .to.be.revertedWithCustomError(blockEstate, "InvalidPrice");
    });

    it("Should revert if listing more shares than owned", async function () {
      const { blockEstate, seller, buyer, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);
      await blockEstate.verifyAsset(1);
      await blockEstate.createFractionalAsset(1, totalTokens);
      await blockEstate.connect(buyer).buyFractionalAsset(1, 10);

      await expect(blockEstate.connect(buyer).listSharesForSale(1, 15, ethers.parseUnits("10", 6)))
        .to.be.revertedWithCustomError(blockEstate, "NotEnoughTokensOwned");
    });
  });

  // Test suite for buying listed shares
  describe("Buy Listed Shares", function () {
    it("Should allow user to buy listed shares", async function () {
      const { blockEstate, blockEstateFractionalToken, usdc, seller, buyer, otherAccount, owner, assetPrice, totalTokens, shareTradingFeePercentage } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);
      await blockEstate.verifyAsset(1);
      await blockEstate.createFractionalAsset(1, totalTokens);
      
      const numTokens = 20;
      await blockEstate.connect(buyer).buyFractionalAsset(1, numTokens);
      
      // Approve and list shares
      await blockEstateFractionalToken.connect(buyer).approve(blockEstate.target, numTokens);
      const sharesToList = 10;
      const pricePerShare = ethers.parseUnits("12", 6);
      await blockEstate.connect(buyer).listSharesForSale(1, sharesToList, pricePerShare);
      
      const totalPrice = pricePerShare * BigInt(sharesToList);
      const tradingFee = (totalPrice * BigInt(shareTradingFeePercentage)) / BigInt(100);
      const sellerPayment = totalPrice - tradingFee;
      
      const buyerBalanceBefore = await usdc.balanceOf(buyer.address);
      const otherAccountBalanceBefore = await usdc.balanceOf(otherAccount.address);
      const ownerBalanceBefore = await usdc.balanceOf(owner.address);
      
      await expect(blockEstate.connect(otherAccount).buyListedShares(1))
        .to.emit(blockEstate, "SharesPurchased")
        .withArgs(1, 1, otherAccount.address, buyer.address, sharesToList, totalPrice);
      
      // Verify balances
      expect(await usdc.balanceOf(buyer.address)).to.equal(buyerBalanceBefore + sellerPayment);
      expect(await usdc.balanceOf(otherAccount.address)).to.equal(otherAccountBalanceBefore - totalPrice);
      expect(await usdc.balanceOf(owner.address)).to.equal(ownerBalanceBefore + tradingFee);
      
      // Verify share ownership
      expect(await blockEstate.getBuyerFractions(buyer.address, 1)).to.equal(numTokens - sharesToList);
      expect(await blockEstate.getBuyerFractions(otherAccount.address, 1)).to.equal(sharesToList);
      expect(await blockEstateFractionalToken.balanceOf(otherAccount.address)).to.equal(sharesToList);
      
      // Verify listing is inactive
      const listing = await blockEstate.shareListings(1);
      expect(listing.active).to.be.false;
    });

    it("Should revert if listing does not exist", async function () {
      const { blockEstate, buyer } = await loadFixture(deployContractsFixture);
      
      await expect(blockEstate.connect(buyer).buyListedShares(999))
        .to.be.revertedWithCustomError(blockEstate, "ShareListingNotFound");
    });

    it("Should revert if listing is not active", async function () {
      const { blockEstate, blockEstateFractionalToken, seller, buyer, otherAccount, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);
      await blockEstate.verifyAsset(1);
      await blockEstate.createFractionalAsset(1, totalTokens);
      
      await blockEstate.connect(buyer).buyFractionalAsset(1, 20);
      await blockEstateFractionalToken.connect(buyer).approve(blockEstate.target, 20);
      await blockEstate.connect(buyer).listSharesForSale(1, 10, ethers.parseUnits("12", 6));
      
      // Buy the shares (makes listing inactive)
      await blockEstate.connect(otherAccount).buyListedShares(1);
      
      // Try to buy again
      await expect(blockEstate.connect(otherAccount).buyListedShares(1))
        .to.be.revertedWithCustomError(blockEstate, "ShareListingNotActive");
    });

    it("Should revert if buyer tries to buy own shares", async function () {
      const { blockEstate, blockEstateFractionalToken, seller, buyer, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);
      await blockEstate.verifyAsset(1);
      await blockEstate.createFractionalAsset(1, totalTokens);
      
      await blockEstate.connect(buyer).buyFractionalAsset(1, 20);
      await blockEstateFractionalToken.connect(buyer).approve(blockEstate.target, 20);
      await blockEstate.connect(buyer).listSharesForSale(1, 10, ethers.parseUnits("12", 6));
      
      await expect(blockEstate.connect(buyer).buyListedShares(1))
        .to.be.revertedWithCustomError(blockEstate, "CannotBuyOwnShares");
    });
  });

  // Test suite for canceling share listings
  describe("Cancel Share Listing", function () {
    it("Should allow seller to cancel share listing", async function () {
      const { blockEstate, blockEstateFractionalToken, seller, buyer, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);
      await blockEstate.verifyAsset(1);
      await blockEstate.createFractionalAsset(1, totalTokens);
      
      const numTokens = 20;
      await blockEstate.connect(buyer).buyFractionalAsset(1, numTokens);
      
      await blockEstateFractionalToken.connect(buyer).approve(blockEstate.target, numTokens);
      const sharesToList = 10;
      const pricePerShare = ethers.parseUnits("12", 6);
      await blockEstate.connect(buyer).listSharesForSale(1, sharesToList, pricePerShare);
      
      const buyerBalanceBefore = await blockEstateFractionalToken.balanceOf(buyer.address);
      
      await expect(blockEstate.connect(buyer).cancelShareListing(1))
        .to.emit(blockEstate, "ShareListingCanceled")
        .withArgs(1, 1, buyer.address);
      
      // Shares returned to seller
      expect(await blockEstateFractionalToken.balanceOf(buyer.address)).to.equal(buyerBalanceBefore + BigInt(sharesToList));
      
      // Listing is inactive
      const listing = await blockEstate.shareListings(1);
      expect(listing.active).to.be.false;
    });

    it("Should revert if not the seller tries to cancel", async function () {
      const { blockEstate, blockEstateFractionalToken, seller, buyer, otherAccount, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);
      await blockEstate.verifyAsset(1);
      await blockEstate.createFractionalAsset(1, totalTokens);
      
      await blockEstate.connect(buyer).buyFractionalAsset(1, 20);
      await blockEstateFractionalToken.connect(buyer).approve(blockEstate.target, 20);
      await blockEstate.connect(buyer).listSharesForSale(1, 10, ethers.parseUnits("12", 6));
      
      await expect(blockEstate.connect(otherAccount).cancelShareListing(1))
        .to.be.revertedWithCustomError(blockEstate, "NotShareSeller");
    });

    it("Should revert if listing is already inactive", async function () {
      const { blockEstate, blockEstateFractionalToken, seller, buyer, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);
      await blockEstate.verifyAsset(1);
      await blockEstate.createFractionalAsset(1, totalTokens);
      
      await blockEstate.connect(buyer).buyFractionalAsset(1, 20);
      await blockEstateFractionalToken.connect(buyer).approve(blockEstate.target, 20);
      await blockEstate.connect(buyer).listSharesForSale(1, 10, ethers.parseUnits("12", 6));
      
      await blockEstate.connect(buyer).cancelShareListing(1);
      
      await expect(blockEstate.connect(buyer).cancelShareListing(1))
        .to.be.revertedWithCustomError(blockEstate, "ShareListingNotActive");
    });
  });

  // Test suite for getting share listings
  describe("Get Share Listings", function () {
    it("Should return all active share listings for an asset", async function () {
      const { blockEstate, blockEstateFractionalToken, seller, buyer, otherAccount, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);
      await blockEstate.verifyAsset(1);
      await blockEstate.createFractionalAsset(1, totalTokens);
      
      // Two buyers purchase and list shares
      await blockEstate.connect(buyer).buyFractionalAsset(1, 30);
      await blockEstate.connect(otherAccount).buyFractionalAsset(1, 20);
      
      await blockEstateFractionalToken.connect(buyer).approve(blockEstate.target, 30);
      await blockEstateFractionalToken.connect(otherAccount).approve(blockEstate.target, 20);
      
      await blockEstate.connect(buyer).listSharesForSale(1, 10, ethers.parseUnits("12", 6));
      await blockEstate.connect(otherAccount).listSharesForSale(1, 15, ethers.parseUnits("11", 6));
      
      const listings = await blockEstate.getAssetShareListings(1);
      expect(listings.length).to.equal(2);
      expect(listings[0].numShares).to.equal(10);
      expect(listings[1].numShares).to.equal(15);
    });

    it("Should return all active share listings across all assets", async function () {
      const { blockEstate, blockEstateFractionalToken, seller, buyer, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);
      await blockEstate.connect(seller).createAsset("ipfs://token2", assetPrice);
      await blockEstate.verifyAsset(1);
      await blockEstate.verifyAsset(2);
      await blockEstate.createFractionalAsset(1, totalTokens);
      await blockEstate.createFractionalAsset(2, totalTokens);
      
      await blockEstate.connect(buyer).buyFractionalAsset(1, 20);
      await blockEstate.connect(buyer).buyFractionalAsset(2, 15);

      await blockEstateFractionalToken.connect(buyer).approve(blockEstate.target, 20);
      //expect(assets[2].price).to.equal(assetPrice);
      //expect(assets[2].seller).to.equal(seller.address);
    });

    // Test that fetchAllListedAssets returns an empty list when no assets are listed
    it("Should return empty list when no assets are listed", async function () {
      const { blockEstate } = await loadFixture(deployContractsFixture);
      const assets = await blockEstate.fetchAllListedAssets();
      expect(assets.length).to.equal(0);
    });

    // Test that fetchAllListedAssets handles multiple assets
    it("Should return multiple listed assets", async function () {
      const { blockEstate, seller, assetPrice } = await loadFixture(deployContractsFixture);
      await blockEstate.connect(seller).registerSeller();
      await blockEstate.connect(seller).createAsset("ipfs://token1", assetPrice);
      await blockEstate.connect(seller).createAsset("ipfs://token2", assetPrice);
      const assets = await blockEstate.fetchAllListedAssets();
      expect(assets.length).to.equal(2);
      expect(assets[0].price).to.equal(assetPrice);
      expect(assets[0].seller).to.equal(seller.address);
    });
  });
});
*/