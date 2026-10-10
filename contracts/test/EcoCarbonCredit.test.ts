import { expect } from "chai";
import { ethers } from "hardhat";
import { EcoCarbonCredit } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("EcoCarbonCredit", function () {
  let credit: EcoCarbonCredit;
  let admin: HardhatEthersSigner;
  let minter: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;

  const TOKEN_ID = 101n;
  const AMOUNT = 5000n; // 5.0 tCO2e (5000 milli-credits)
  const CID = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";

  beforeEach(async function () {
    [admin, minter, user1, user2] = await ethers.getSigners();

    const EcoCarbonCreditFactory = await ethers.getContractFactory("EcoCarbonCredit");
    credit = (await EcoCarbonCreditFactory.deploy(admin.address)) as EcoCarbonCredit;
    await credit.waitForDeployment();
  });

  describe("Deployment & AccessControl", function () {
    it("should set deployer as admin and minter", async function () {
      const DEFAULT_ADMIN_ROLE = await credit.DEFAULT_ADMIN_ROLE();
      const MINTER_ROLE = await credit.MINTER_ROLE();

      expect(await credit.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
      expect(await credit.hasRole(MINTER_ROLE, admin.address)).to.be.true;
    });

    it("should reject deployment to zero address", async function () {
      const EcoCarbonCreditFactory = await ethers.getContractFactory("EcoCarbonCredit");
      await expect(
        EcoCarbonCreditFactory.deploy(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(credit, "ZeroAddress");
    });

    it("should allow granting MINTER_ROLE to another account", async function () {
      const MINTER_ROLE = await credit.MINTER_ROLE();
      await credit.connect(admin).grantRole(MINTER_ROLE, minter.address);
      expect(await credit.hasRole(MINTER_ROLE, minter.address)).to.be.true;
    });
  });

  describe("Minting", function () {
    it("should mint successfully by minter", async function () {
      await expect(credit.connect(admin).mint(user1.address, TOKEN_ID, AMOUNT, CID))
        .to.emit(credit, "TransferSingle")
        .withArgs(admin.address, ethers.ZeroAddress, user1.address, TOKEN_ID, AMOUNT);

      expect(await credit.balanceOf(user1.address, TOKEN_ID)).to.equal(AMOUNT);
      expect(await credit["totalSupply(uint256)"](TOKEN_ID)).to.equal(AMOUNT);
      expect(await credit.tokenCID(TOKEN_ID)).to.equal(CID);
      expect(await credit.uri(TOKEN_ID)).to.equal(`ipfs://${CID}`);
    });

    it("should return default uri if no CID set", async function () {
      expect(await credit.uri(999n)).to.equal("");
    });

    it("should revert mint if caller lacks MINTER_ROLE", async function () {
      await expect(
        credit.connect(user1).mint(user1.address, TOKEN_ID, AMOUNT, CID)
      ).to.be.revertedWithCustomError(credit, "AccessControlUnauthorizedAccount");
    });

    it("should revert if minting to address zero", async function () {
      await expect(
        credit.connect(admin).mint(ethers.ZeroAddress, TOKEN_ID, AMOUNT, CID)
      ).to.be.revertedWithCustomError(credit, "ZeroAddress");
    });

    it("should revert if minting 0 amount", async function () {
      await expect(
        credit.connect(admin).mint(user1.address, TOKEN_ID, 0n, CID)
      ).to.be.revertedWithCustomError(credit, "ZeroAmount");
    });

    it("should revert if re-minting existing token ID", async function () {
      await credit.connect(admin).mint(user1.address, TOKEN_ID, AMOUNT, CID);

      await expect(
        credit.connect(admin).mint(user1.address, TOKEN_ID, 100n, CID)
      ).to.be.revertedWithCustomError(credit, "TokenAlreadyMinted").withArgs(TOKEN_ID);
    });
  });

  describe("Retirement", function () {
    beforeEach(async function () {
      await credit.connect(admin).mint(user1.address, TOKEN_ID, AMOUNT, CID);
    });

    it("should retire tokens and emit CarbonRetired", async function () {
      const retireAmount = 2000n;
      const beneficiary = "Acme Corp";
      const reason = "FY2026 Scope 1 Offset";

      await expect(
        credit.connect(user1).retire(TOKEN_ID, retireAmount, beneficiary, reason)
      )
        .to.emit(credit, "CarbonRetired")
        .withArgs(user1.address, TOKEN_ID, retireAmount, beneficiary, reason);

      expect(await credit.balanceOf(user1.address, TOKEN_ID)).to.equal(AMOUNT - retireAmount);
      expect(await credit["totalSupply(uint256)"](TOKEN_ID)).to.equal(AMOUNT - retireAmount);
    });

    it("should revert retire when amount is 0", async function () {
      await expect(
        credit.connect(user1).retire(TOKEN_ID, 0n, "Acme", "Offset")
      ).to.be.revertedWithCustomError(credit, "ZeroAmount");
    });

    it("should revert retire when caller has insufficient balance", async function () {
      await expect(
        credit.connect(user1).retire(TOKEN_ID, AMOUNT + 1n, "Acme", "Offset")
      ).to.be.revertedWithCustomError(credit, "ERC1155InsufficientBalance");
    });

    it("should revert retire when non-holder attempts retire", async function () {
      await expect(
        credit.connect(user2).retire(TOKEN_ID, 100n, "Acme", "Offset")
      ).to.be.revertedWithCustomError(credit, "ERC1155InsufficientBalance");
    });
  });

  describe("ERC165 Interface Support", function () {
    it("should support ERC1155 interface", async function () {
      // 0xd9b67a26 is ERC1155 interface id
      expect(await credit.supportsInterface("0xd9b67a26")).to.be.true;
    });

    it("should support AccessControl interface", async function () {
      // 0x7965db0b is AccessControl interface id
      expect(await credit.supportsInterface("0x7965db0b")).to.be.true;
    });
  });
});
