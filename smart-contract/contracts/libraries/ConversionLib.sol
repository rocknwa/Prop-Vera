// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/// @title ConversionLib
/// @notice Pure helper functions for converting between human-readable ETH
///         values and on-chain wei storage for USDC (6 dec) and ERC-20
///         fractional tokens (18 dec).
/// @dev    All functions are `internal pure` so they inline at the call-site
///         with zero overhead — no JUMP, no external call gas penalty.
library ConversionLib {
    uint256 internal constant USDC_UNIT  = 1e6;   // 1 USDC  = 1_000_000 base units
    uint256 internal constant TOKEN_UNIT = 1e18;  // 1 Token = 1e18 base units

    // ── USDC conversions ────────────────────────────────────────────────────

    /// @notice Multiply a human-readable USDC amount by 1e6.
    function usdcToWei(uint256 ethAmount) internal pure returns (uint256) {
        return ethAmount * USDC_UNIT;
    }

    /// @notice Divide a USDC wei amount by 1e6.
    function usdcFromWei(uint256 weiAmount) internal pure returns (uint256) {
        return weiAmount / USDC_UNIT;
    }

    // ── Token conversions ───────────────────────────────────────────────────

    /// @notice Multiply a human-readable token amount by 1e18.
    function tokenToWei(uint256 ethAmount) internal pure returns (uint256) {
        return ethAmount * TOKEN_UNIT;
    }

    /// @notice Divide a token wei amount by 1e18.
    function tokenFromWei(uint256 weiAmount) internal pure returns (uint256) {
        return weiAmount / TOKEN_UNIT;
    }
}
