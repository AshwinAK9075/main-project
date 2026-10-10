import { expect } from "chai";
import { ethers } from "hardhat";
import {
  EcoCarbonCredit,
  CarbonMarketplace,
  MockUSDC,
} from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("CarbonMarketplace & MockUSDC", function () {
  let credit: EcoCarbonCredit;
  let marketplace: CarbonMarketplace;
  let usdc: MockUSDC;

  let owner: HardhatEthersSigner;
  let seller: HardhatEthersSigner;
  let buyer1: HardhatEthersSigner;
  let buyer2: HardhatEthersSigner;

  const TOKEN_ID = 201n;
  const TOTAL_CREDITS = 10_000n; // 10 tCO2e (10 000 milli-credits)
  const PRICE_PER_UNIT = 25_000n; // 0.025 USDC per milli-credit ($25/tonne)
  const CID = "QmZtmD2qt8fJpq3CLDHjdSDqjVhvW51PR2H6nM8ind436J";

  beforeEach(async function () {
    [owner, seller, buyer1, buyer2] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    usdc = (await MockUSDCFactory.deploy()) as MockUSDC;
    await usdc.waitForDeployment();

    // Deploy EcoCarbonCredit
    const EcoCarbonCreditFactory = await ethers.getContractFactory("EcoCarbonCredit");
    credit = (await EcoCarbonCreditFactory.deploy(owner.address)) as EcoCarbonCredit;
    await credit.waitForDeployment();

    // Deploy CarbonMarketplace with 200 bps (2.0%) platform fee
    const CarbonMarketplaceFactory = await ethers.getContractFactory("CarbonMarketplace");
    marketplace = (await CarbonMarketplaceFactory.deploy(
      owner.address,
      200n
    )) as CarbonMarketplace;
    await marketplace.waitForDeployment();

    // Mint credits to seller
    await credit.connect(owner).mint(seller.address, TOKEN_ID, TOTAL_CREDITS, CID);

    // Approve marketplace for ERC1155 transfer
    await credit.connect(seller).setApprovalForAll(await marketplace.getAddress(), true);

    // Give buyers some USDC
    await usdc.connect(buyer1).faucet(); // 1,000 USDC
    await usdc.connect(buyer2).faucet(); // 1,000 USDC
  });

  describe("MockUSDC", function () {
    it("should return 6 decimals", async function () {
      expect(await usdc.decimals()).to.equal(6);
    });

    it("should mint 1 000 USDC via faucet", async function () {
      const balanceBefore = await usdc.balanceOf(buyer1.address);
      await usdc.connect(buyer1).faucet();
      const balanceAfter = await usdc.balanceOf(buyer1.address);
      expect(balanceAfter - balanceBefore).to.equal(1_000n * 10n ** 6n);
    });

    it("should allow arbitrary mint", async function () {
      await usdc.mint(buyer1.address, 500n);
      expect(await usdc.balanceOf(buyer1.address)).to.be.greaterThanOrEqual(500n);
    });
  });

  describe("Deployment & Configuration", function () {
    it("should set owner and feeBps correctly", async function () {
      expect(await marketplace.owner()).to.equal(owner.address);
      expect(await marketplace.feeBps()).to.equal(200n);
      expect(await marketplace.MAX_FEE_BPS()).to.equal(500n);
    });

    it("should reject deployment with zero owner address", async function () {
      const CarbonMarketplaceFactory = await ethers.getContractFactory("CarbonMarketplace");
      await expect(
        CarbonMarketplaceFactory.deploy(ethers.ZeroAddress, 200n)
      ).to.be.revertedWithCustomError(marketplace, "OwnableInvalidOwner");
    });

    it("should reject deployment with fee > MAX_FEE_BPS", async function () {
      const CarbonMarketplaceFactory = await ethers.getContractFactory("CarbonMarketplace");
      await expect(
        CarbonMarketplaceFactory.deploy(owner.address, 501n)
      ).to.be.revertedWithCustomError(marketplace, "FeeTooHigh");
    });
  });

  describe("Listings", function () {
    it("should create a listing and escrow credits", async function () {
      const marketplaceAddr = await marketplace.getAddress();
      const creditAddr = await credit.getAddress();
      const usdcAddr = await usdc.getAddress();

      await expect(
        marketplace
          .connect(seller)
          .createListing(creditAddr, TOKEN_ID, 4000n, usdcAddr, PRICE_PER_UNIT)
      )
        .to.emit(marketplace, "ListingCreated")
        .withArgs(0n, seller.address, creditAddr, TOKEN_ID, 4000n, usdcAddr, PRICE_PER_UNIT);

      expect(await marketplace.nextListingId()).to.equal(1n);

      const listing = await marketplace.listings(0n);
      expect(listing.seller).to.equal(seller.address);
      expect(listing.creditContract).to.equal(creditAddr);
      expect(listing.tokenId).to.equal(TOKEN_ID);
      expect(listing.totalAmount).to.equal(4000n);
      expect(listing.remainingAmount).to.equal(4000n);
      expect(listing.paymentToken).to.equal(usdcAddr);
      expect(listing.pricePerUnit).to.equal(PRICE_PER_UNIT);
      expect(listing.active).to.be.true;

      // Check escrow balance
      expect(await credit.balanceOf(marketplaceAddr, TOKEN_ID)).to.equal(4000n);
      expect(await credit.balanceOf(seller.address, TOKEN_ID)).to.equal(TOTAL_CREDITS - 4000n);
    });

    it("should revert createListing with zero address credit contract", async function () {
      await expect(
        marketplace
          .connect(seller)
          .createListing(ethers.ZeroAddress, TOKEN_ID, 1000n, await usdc.getAddress(), PRICE_PER_UNIT)
      ).to.be.revertedWithCustomError(marketplace, "ZeroAddress");
    });

    it("should revert createListing with zero address payment token", async function () {
      await expect(
        marketplace
          .connect(seller)
          .createListing(await credit.getAddress(), TOKEN_ID, 1000n, ethers.ZeroAddress, PRICE_PER_UNIT)
      ).to.be.revertedWithCustomError(marketplace, "ZeroAddress");
    });

    it("should revert createListing with zero amount", async function () {
      await expect(
        marketplace
          .connect(seller)
          .createListing(await credit.getAddress(), TOKEN_ID, 0n, await usdc.getAddress(), PRICE_PER_UNIT)
      ).to.be.revertedWithCustomError(marketplace, "ZeroAmount");
    });

    it("should revert createListing with zero pricePerUnit", async function () {
      await expect(
        marketplace
          .connect(seller)
          .createListing(await credit.getAddress(), TOKEN_ID, 1000n, await usdc.getAddress(), 0n)
      ).to.be.revertedWithCustomError(marketplace, "ZeroPrice");
    });
  });

  describe("Buying Credits", function () {
    const LISTED_AMOUNT = 5000n;

    beforeEach(async function () {
      await marketplace
        .connect(seller)
        .createListing(
          await credit.getAddress(),
          TOKEN_ID,
          LISTED_AMOUNT,
          await usdc.getAddress(),
          PRICE_PER_UNIT
        );

      // Approve marketplace for buyer1
      await usdc
        .connect(buyer1)
        .approve(await marketplace.getAddress(), ethers.MaxUint256);
      await usdc
        .connect(buyer2)
        .approve(await marketplace.getAddress(), ethers.MaxUint256);
    });

    it("should support partial fills", async function () {
      const buyAmount = 2000n;
      const totalCost = buyAmount * PRICE_PER_UNIT; // 2000 * 25000 = 50,000,000 (50 USDC)
      const fee = (totalCost * 200n) / 10_000n; // 2% fee = 1,000,000 (1 USDC)
      const sellerProceeds = totalCost - fee; // 49 USDC

      const sellerBalanceBefore = await usdc.balanceOf(seller.address);
      const buyerCreditBefore = await credit.balanceOf(buyer1.address, TOKEN_ID);

      await expect(marketplace.connect(buyer1).buy(0n, buyAmount))
        .to.emit(marketplace, "CreditsPurchased")
        .withArgs(0n, buyer1.address, buyAmount, totalCost);

      // Check remaining listing state
      const listing = await marketplace.listings(0n);
      expect(listing.remainingAmount).to.equal(LISTED_AMOUNT - buyAmount);
      expect(listing.active).to.be.true;

      // Check token balances
      expect(await credit.balanceOf(buyer1.address, TOKEN_ID)).to.equal(buyerCreditBefore + buyAmount);
      expect(await usdc.balanceOf(seller.address)).to.equal(sellerBalanceBefore + sellerProceeds);
      expect(await usdc.balanceOf(await marketplace.getAddress())).to.equal(fee);
    });

    it("should complete full fill and deactivate listing", async function () {
      await marketplace.connect(buyer1).buy(0n, LISTED_AMOUNT);

      const listing = await marketplace.listings(0n);
      expect(listing.remainingAmount).to.equal(0n);
      expect(listing.active).to.be.false;
    });

    it("should revert if buying 0 credits", async function () {
      await expect(
        marketplace.connect(buyer1).buy(0n, 0n)
      ).to.be.revertedWithCustomError(marketplace, "ZeroAmount");
    });

    it("should revert if buying more than remaining credits", async function () {
      await expect(
        marketplace.connect(buyer1).buy(0n, LISTED_AMOUNT + 1n)
      ).to.be.revertedWithCustomError(marketplace, "InsufficientCreditsAvailable");
    });

    it("should revert if buying from inactive listing", async function () {
      // First buy all
      await marketplace.connect(buyer1).buy(0n, LISTED_AMOUNT);

      // Try to buy again
      await expect(
        marketplace.connect(buyer2).buy(0n, 100n)
      ).to.be.revertedWithCustomError(marketplace, "ListingNotActive");
    });
  });

  describe("Cancelling Listings", function () {
    const LISTED_AMOUNT = 3000n;

    beforeEach(async function () {
      await marketplace
        .connect(seller)
        .createListing(
          await credit.getAddress(),
          TOKEN_ID,
          LISTED_AMOUNT,
          await usdc.getAddress(),
          PRICE_PER_UNIT
        );
    });

    it("should allow seller to cancel and receive remaining credits back", async function () {
      const sellerBalanceBefore = await credit.balanceOf(seller.address, TOKEN_ID);

      await expect(marketplace.connect(seller).cancelListing(0n))
        .to.emit(marketplace, "ListingCancelled")
        .withArgs(0n, seller.address);

      const listing = await marketplace.listings(0n);
      expect(listing.active).to.be.false;
      expect(listing.remainingAmount).to.equal(0n);

      expect(await credit.balanceOf(seller.address, TOKEN_ID)).to.equal(
        sellerBalanceBefore + LISTED_AMOUNT
      );
    });

    it("should revert if non-seller attempts to cancel", async function () {
      await expect(
        marketplace.connect(buyer1).cancelListing(0n)
      ).to.be.revertedWithCustomError(marketplace, "NotSeller");
    });

    it("should revert if cancelling already cancelled listing", async function () {
      await marketplace.connect(seller).cancelListing(0n);

      await expect(
        marketplace.connect(seller).cancelListing(0n)
      ).to.be.revertedWithCustomError(marketplace, "ListingNotActive");
    });
  });

  describe("Admin & Fee Management", function () {
    it("should allow owner to update feeBps", async function () {
      await expect(marketplace.connect(owner).setFeeBps(350n))
        .to.emit(marketplace, "FeeBpsUpdated")
        .withArgs(200n, 350n);

      expect(await marketplace.feeBps()).to.equal(350n);
    });

    it("should revert setFeeBps if exceeding MAX_FEE_BPS", async function () {
      await expect(
        marketplace.connect(owner).setFeeBps(501n)
      ).to.be.revertedWithCustomError(marketplace, "FeeTooHigh");
    });

    it("should revert setFeeBps if called by non-owner", async function () {
      await expect(
        marketplace.connect(seller).setFeeBps(100n)
      ).to.be.revertedWithCustomError(marketplace, "OwnableUnauthorizedAccount");
    });

    it("should allow owner to withdraw accumulated fees", async function () {
      // List and buy to accumulate fees
      await marketplace
        .connect(seller)
        .createListing(
          await credit.getAddress(),
          TOKEN_ID,
          1000n,
          await usdc.getAddress(),
          PRICE_PER_UNIT
        );

      await usdc
        .connect(buyer1)
        .approve(await marketplace.getAddress(), ethers.MaxUint256);
      await marketplace.connect(buyer1).buy(0n, 1000n);

      const marketplaceUsdc = await usdc.balanceOf(await marketplace.getAddress());
      expect(marketplaceUsdc).to.be.greaterThan(0n);

      const recipient = buyer2.address;
      const recipientBalanceBefore = await usdc.balanceOf(recipient);

      await expect(
        marketplace
          .connect(owner)
          .withdrawFees(await usdc.getAddress(), recipient)
      )
        .to.emit(marketplace, "FeesWithdrawn")
        .withArgs(recipient, await usdc.getAddress(), marketplaceUsdc);

      expect(await usdc.balanceOf(recipient)).to.equal(
        recipientBalanceBefore + marketplaceUsdc
      );
      expect(await usdc.balanceOf(await marketplace.getAddress())).to.equal(0n);
    });

    it("should revert withdrawFees if called by non-owner", async function () {
      await expect(
        marketplace
          .connect(seller)
          .withdrawFees(await usdc.getAddress(), seller.address)
      ).to.be.revertedWithCustomError(marketplace, "OwnableUnauthorizedAccount");
    });

    it("should revert withdrawFees with zero address recipient", async function () {
      await expect(
        marketplace
          .connect(owner)
          .withdrawFees(await usdc.getAddress(), ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(marketplace, "ZeroAddress");
    });
  });
});
