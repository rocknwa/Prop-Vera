 //SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockUSDC - Mock USDC Token for Testing
/// @notice Allows minting USDC with ETH input (automatically converts to wei)
/// @dev Users pass amounts in ETH, contract mints in wei (6 decimals)
contract MockUSDC is ERC20 {
    uint256 private constant USDC_DECIMALS = 6;
    uint256 private constant USDC_UNIT = 1e6; // 1 USDC in wei

    constructor() ERC20("Mock USDC", "USDC") {}

    /// @notice Mint USDC tokens
    /// @param to Recipient address
    /// @param amountInEth Amount in ETH (will be converted to wei internally)
    /// @dev Converts ETH amount to wei by multiplying by 1e6
    /// @dev Example: mint(user, 1000) will mint 1,000,000,000 wei (1000 USDC)
    function mint(address to, uint256 amountInEth) external {
        uint256 amountInWei = amountInEth * USDC_UNIT;
        _mint(to, amountInWei);
    }

    /// @notice Mint USDC tokens directly in wei (for advanced use)
    /// @param to Recipient address
    /// @param amountInWei Amount in wei (6 decimals)
    /// @dev Use this function if you need to mint exact wei amounts
    function mintWei(address to, uint256 amountInWei) external {
        _mint(to, amountInWei);
    }

    /// @notice Get the number of decimals for USDC
    /// @return Number of decimals (6)
    function decimals() public pure override returns (uint8) {
        return 6; // USDC has 6 decimals
    }

    /// @notice Convert ETH amount to wei
    /// @param amountInEth Amount in ETH
    /// @return Amount in wei (6 decimals)
    function ethToWei(uint256 amountInEth) public pure returns (uint256) {
        return amountInEth * USDC_UNIT;
    }

    /// @notice Convert wei amount to ETH
    /// @param amountInWei Amount in wei (6 decimals)
    /// @return Amount in ETH
    function weiToEth(uint256 amountInWei) public pure returns (uint256) {
        return amountInWei / USDC_UNIT;
    }
}