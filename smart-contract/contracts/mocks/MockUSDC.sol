// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title MockUSDC
/// @notice Mock USDC token for test and staging environments.
/// @dev    Inherits OpenZeppelin ERC20 (6-decimal override) and Ownable.
///         Key improvements over the original:
///         • mint() is guarded by a minter whitelist — addresses must be
///           explicitly authorised, preventing permissionless inflation in
///           shared test/staging networks while keeping the API identical
///           for unit tests that call mockUsdc.mint(user, amount).
///         • ethToWei / weiToEth helpers are `external pure` — cheaper than
///           `public` because arguments stay in calldata.
///         • USDC_UNIT constant is used directly; no redundant local variable.
///         • Zero-address recipient is rejected on mint to match production
///           USDC behaviour and catch accidental test mistakes early.
contract MockUSDC is ERC20, Ownable {
    // ── Constants ─────────────────────────────────────────────────────────────
    uint256 private constant USDC_UNIT = 1e6;

    // ── Minter whitelist ─────────────────────────────────────────────────────
    /// @notice Addresses allowed to call mint().
    /// @dev The deployer is added automatically in the constructor.
    mapping(address => bool) public isMinter;

    // ── Errors ────────────────────────────────────────────────────────────────
    error NotMinter();
    error ZeroAddress();

    // ── Events ────────────────────────────────────────────────────────────────
    event MinterSet(address indexed account, bool enabled);

    // ── Constructor ───────────────────────────────────────────────────────────
    constructor() ERC20("Mock USDC", "USDC") Ownable(msg.sender) {
        // Deployer is a minter by default so existing test scripts work as-is.
        isMinter[msg.sender] = true;
        emit MinterSet(msg.sender, true);
    }

    // ── Access control ────────────────────────────────────────────────────────
    modifier onlyMinter() {
        if (!isMinter[msg.sender]) revert NotMinter();
        _;
    }

    /// @notice Grant or revoke mint permission.
    /// @dev    Call this in your test setUp() to authorise PropVera or other
    ///         contracts that need to interact with MockUSDC.
    function setMinter(address account, bool enabled) external onlyOwner {
        isMinter[account] = enabled;
        emit MinterSet(account, enabled);
    }

    // ── Mint ──────────────────────────────────────────────────────────────────

    /// @notice Mint tokens using a human-readable USDC amount.
    /// @param  to          Recipient address.
    /// @param  amountInEth Amount expressed as whole USDC (e.g. 1000 → 1 000 USDC).
    ///                     Internally multiplied by 1e6 before minting.
    function mint(address to, uint256 amountInEth) external onlyMinter {
        if (to == address(0)) revert ZeroAddress();
        _mint(to, amountInEth * USDC_UNIT);
    }

    /// @notice Mint tokens using exact wei (6-decimal base units).
    /// @dev    Use when precision below 1 USDC is required.
    function mintWei(address to, uint256 amountInWei) external onlyMinter {
        if (to == address(0)) revert ZeroAddress();
        _mint(to, amountInWei);
    }

    // ── ERC-20 overrides ──────────────────────────────────────────────────────

    /// @notice USDC uses 6 decimal places.
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    // ── Conversion helpers (view, calldata-eligible) ──────────────────────────

    /// @notice Convert a whole-USDC amount to base-unit wei.
    function ethToWei(uint256 amountInEth) external pure returns (uint256) {
        return amountInEth * USDC_UNIT;
    }

    /// @notice Convert a base-unit wei amount to whole-USDC.
    function weiToEth(uint256 amountInWei) external pure returns (uint256) {
        return amountInWei / USDC_UNIT;
    }
}
