// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

/**
 * @title CarbonMarketplace
 * @notice Peer-to-peer marketplace for EcoCarbonCredit ERC-1155 tokens.
 *
 *  Mechanics
 *  ──────────
 *  1. Sellers call createListing() to escrow their credits in this contract.
 *  2. Buyers call buy() to purchase any amount up to the listing's remaining
 *     credits.  Payment is in an ERC-20 token (mock USDC on testnet).
 *  3. A platform fee (in basis points, default 0, max 500 = 5%) is deducted
 *     from the seller proceeds.  Fees accumulate in this contract and are
 *     withdrawn by the owner.
 *  4. Sellers can cancel unsold credits at any time.
 *
 *  Invariants / security
 *  ──────────────────────
 *  • ReentrancyGuard on buy() and cancelListing() — state is updated BEFORE
 *    all external calls (checks-effects-interactions).
 *  • SafeERC20 wrappers on every ERC-20 transfer.
 *  • No arithmetic overflow (Solidity 0.8 built-in).
 */
contract CarbonMarketplace is ERC1155Holder, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // ─── Constants ────────────────────────────────────────────────────────────
    uint256 public constant MAX_FEE_BPS = 500; // 5 %
    uint256 private constant BPS_DENOMINATOR = 10_000;

    // ─── Storage ─────────────────────────────────────────────────────────────
    struct Listing {
        address seller;
        address creditContract; // EcoCarbonCredit address
        uint256 tokenId;
        uint256 totalAmount;     // original escrowed units
        uint256 remainingAmount; // available for purchase
        address paymentToken;    // mUSDC address
        uint256 pricePerUnit;    // payment-token units per credit unit (6 dec for USDC)
        bool active;
    }

    uint256 public nextListingId;
    mapping(uint256 => Listing) public listings;

    /// @notice Platform fee in basis points (owner-adjustable, max 500).
    uint256 public feeBps;

    // ─── Custom errors ────────────────────────────────────────────────────────
    error ZeroAmount();
    error ZeroAddress();
    error ZeroPrice();
    error ListingNotActive(uint256 listingId);
    error InsufficientCreditsAvailable(uint256 available, uint256 requested);
    error NotSeller(uint256 listingId);
    error FeeTooHigh(uint256 requested, uint256 max);

    // ─── Events ───────────────────────────────────────────────────────────────
    event ListingCreated(
        uint256 indexed listingId,
        address indexed seller,
        address indexed creditContract,
        uint256 tokenId,
        uint256 amount,
        address paymentToken,
        uint256 pricePerUnit
    );

    event CreditsPurchased(
        uint256 indexed listingId,
        address indexed buyer,
        uint256 amount,
        uint256 totalCost
    );

    event ListingCancelled(uint256 indexed listingId, address indexed seller);

    event FeeBpsUpdated(uint256 oldFeeBps, uint256 newFeeBps);

    event FeesWithdrawn(address indexed to, address token, uint256 amount);

    // ─── Constructor ──────────────────────────────────────────────────────────
    /**
     * @param initialOwner Address that receives Ownable ownership (for fee mgmt).
     * @param initialFeeBps Starting platform fee in basis points (use 0 for testnet).
     */
    constructor(
        address initialOwner,
        uint256 initialFeeBps
    ) Ownable(initialOwner) {
        if (initialOwner == address(0)) revert ZeroAddress();
        if (initialFeeBps > MAX_FEE_BPS) revert FeeTooHigh(initialFeeBps, MAX_FEE_BPS);
        feeBps = initialFeeBps;
    }

    // ─── Listing ──────────────────────────────────────────────────────────────
    /**
     * @notice Escrow carbon credits and create a new listing.
     * @dev    Caller must have approved this contract on the ERC-1155 first.
     * @param creditContract  Address of the EcoCarbonCredit contract.
     * @param tokenId         Token ID to list.
     * @param amount          Units to escrow (must be > 0).
     * @param paymentToken    ERC-20 address buyers will pay with (mUSDC).
     * @param pricePerUnit    Payment-token amount per credit unit (6-dec USDC units).
     * @return listingId      Newly created listing ID.
     */
    function createListing(
        address creditContract,
        uint256 tokenId,
        uint256 amount,
        address paymentToken,
        uint256 pricePerUnit
    ) external returns (uint256 listingId) {
        if (creditContract == address(0)) revert ZeroAddress();
        if (paymentToken == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (pricePerUnit == 0) revert ZeroPrice();

        listingId = nextListingId++;
        listings[listingId] = Listing({
            seller: msg.sender,
            creditContract: creditContract,
            tokenId: tokenId,
            totalAmount: amount,
            remainingAmount: amount,
            paymentToken: paymentToken,
            pricePerUnit: pricePerUnit,
            active: true
        });

        // Transfer credits from seller → marketplace escrow
        IERC1155(creditContract).safeTransferFrom(
            msg.sender,
            address(this),
            tokenId,
            amount,
            ""
        );

        emit ListingCreated(
            listingId,
            msg.sender,
            creditContract,
            tokenId,
            amount,
            paymentToken,
            pricePerUnit
        );
    }

    // ─── Buying ───────────────────────────────────────────────────────────────
    /**
     * @notice Purchase up to `amount` credits from a listing.
     * @dev    Partial fills are allowed: buyer can buy fewer than remaining credits.
     *         Checks-effects-interactions: state updated before external calls.
     * @param listingId  ID of the listing to purchase from.
     * @param amount     Units to buy (must be > 0 and ≤ remainingAmount).
     */
    function buy(
        uint256 listingId,
        uint256 amount
    ) external nonReentrant {
        Listing storage listing = listings[listingId];

        if (!listing.active) revert ListingNotActive(listingId);
        if (amount == 0) revert ZeroAmount();
        if (amount > listing.remainingAmount)
            revert InsufficientCreditsAvailable(listing.remainingAmount, amount);

        // ── Effects ───────────────────────────────────────────────────────────
        listing.remainingAmount -= amount;
        if (listing.remainingAmount == 0) {
            listing.active = false;
        }

        uint256 totalCost = amount * listing.pricePerUnit;
        // Platform fee calculation (integer division — dust goes to seller)
        uint256 fee = (totalCost * feeBps) / BPS_DENOMINATOR;
        uint256 sellerProceeds = totalCost - fee;

        address seller = listing.seller;
        address creditContract = listing.creditContract;
        uint256 tokenId = listing.tokenId;
        address paymentToken = listing.paymentToken;

        emit CreditsPurchased(listingId, msg.sender, amount, totalCost);

        // ── Interactions ──────────────────────────────────────────────────────
        // 1. Collect payment from buyer
        IERC20(paymentToken).safeTransferFrom(msg.sender, address(this), totalCost);
        // 2. Pay seller (fee stays in contract for owner to withdraw)
        IERC20(paymentToken).safeTransfer(seller, sellerProceeds);
        // 3. Deliver credits to buyer
        IERC1155(creditContract).safeTransferFrom(
            address(this),
            msg.sender,
            tokenId,
            amount,
            ""
        );
    }

    // ─── Cancellation ─────────────────────────────────────────────────────────
    /**
     * @notice Cancel a listing and return unsold credits to the seller.
     * @dev    Only the original seller can cancel.
     * @param listingId  ID of the listing to cancel.
     */
    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];

        if (!listing.active) revert ListingNotActive(listingId);
        if (listing.seller != msg.sender) revert NotSeller(listingId);

        uint256 remaining = listing.remainingAmount;
        address creditContract = listing.creditContract;
        uint256 tokenId = listing.tokenId;

        // ── Effects ───────────────────────────────────────────────────────────
        listing.active = false;
        listing.remainingAmount = 0;

        emit ListingCancelled(listingId, msg.sender);

        // ── Interactions ──────────────────────────────────────────────────────
        IERC1155(creditContract).safeTransferFrom(
            address(this),
            msg.sender,
            tokenId,
            remaining,
            ""
        );
    }

    // ─── Admin ────────────────────────────────────────────────────────────────
    /**
     * @notice Update the platform fee (owner only).
     * @param newFeeBps New fee in basis points (max 500 = 5 %).
     */
    function setFeeBps(uint256 newFeeBps) external onlyOwner {
        if (newFeeBps > MAX_FEE_BPS) revert FeeTooHigh(newFeeBps, MAX_FEE_BPS);
        emit FeeBpsUpdated(feeBps, newFeeBps);
        feeBps = newFeeBps;
    }

    /**
     * @notice Withdraw accumulated platform fees for a given ERC-20 token.
     * @param token  ERC-20 address to withdraw.
     * @param to     Recipient address.
     */
    function withdrawFees(address token, address to) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        uint256 balance = IERC20(token).balanceOf(address(this));
        IERC20(token).safeTransfer(to, balance);
        emit FeesWithdrawn(to, token, balance);
    }
}
