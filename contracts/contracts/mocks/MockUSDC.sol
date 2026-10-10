// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDC
 * @notice Test-only ERC-20 token with 6 decimals that mimics USDC.
 *         Anyone can call faucet() to mint 1 000 USDC to themselves.
 *         Do NOT use on mainnet.
 */
contract MockUSDC is ERC20 {
    // 1 000 USDC expressed in 6-decimal units
    uint256 public constant FAUCET_AMOUNT = 1_000 * 10 ** 6;

    constructor() ERC20("Mock USD Coin", "mUSDC") {}

    /// @notice Returns 6 (matching real USDC decimals)
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /**
     * @notice Mints FAUCET_AMOUNT (1 000 mUSDC) to the caller.
     *         Public — anyone can call; for testnet use only.
     */
    function faucet() external {
        _mint(msg.sender, FAUCET_AMOUNT);
    }

    /**
     * @notice Owner-style mint for test setup convenience.
     * @param to     Recipient address
     * @param amount Amount in 6-decimal units
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
