// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IMockUSDC {
    function mint(address to, uint256 amountInEth) external;
}

/// @title  USDCFaucet
/// @notice Public faucet — anyone can call drip() to receive test USDC once
///         per cooldown window. Requires this contract to be whitelisted as a
///         minter on MockUSDC (call usdc.setMinter(faucet, true) after deploy).
///
/// @dev    Rate-limiting prevents one address draining all supply.
///         Owner can adjust drip amount and cooldown at any time.
contract USDCFaucet is Ownable(msg.sender) {

    // ── State ─────────────────────────────────────────────────────────────────

    IMockUSDC public immutable usdc;

    /// @notice Amount minted per drip in whole USDC units (e.g. 10000 = 10,000 USDC)
    uint256 public dripAmount = 10_000;

    /// @notice Seconds a user must wait between drips (default 24 hours)
    uint256 public cooldown = 24 hours;

    /// @notice Last drip timestamp per address
    mapping(address => uint256) public lastDrip;

    // ── Errors ────────────────────────────────────────────────────────────────

    error ZeroAddress();
    error CooldownNotElapsed(uint256 secondsRemaining);

    // ── Events ────────────────────────────────────────────────────────────────

    event Dripped(address indexed recipient, uint256 amountInEth);
    event DripAmountUpdated(uint256 newAmount);
    event CooldownUpdated(uint256 newCooldown);

    // ── Constructor ───────────────────────────────────────────────────────────

    constructor(address _usdc) {
        if (_usdc == address(0)) revert ZeroAddress();
        usdc = IMockUSDC(_usdc);
    }

    // ── Public ────────────────────────────────────────────────────────────────

    /// @notice Drip test USDC to the caller.
    /// @dev    Reverts if cooldown has not elapsed since last drip.
    function drip() external {
        uint256 elapsed = block.timestamp - lastDrip[msg.sender];
        if (elapsed < cooldown) {
            revert CooldownNotElapsed(cooldown - elapsed);
        }
        lastDrip[msg.sender] = block.timestamp;
        usdc.mint(msg.sender, dripAmount);
        emit Dripped(msg.sender, dripAmount);
    }

    /// @notice Drip to a specific recipient (useful for frontend tx on behalf).
    function dripTo(address recipient) external {
        if (recipient == address(0)) revert ZeroAddress();
        uint256 elapsed = block.timestamp - lastDrip[recipient];
        if (elapsed < cooldown) {
            revert CooldownNotElapsed(cooldown - elapsed);
        }
        lastDrip[recipient] = block.timestamp;
        usdc.mint(recipient, dripAmount);
        emit Dripped(recipient, dripAmount);
    }

    /// @notice Seconds remaining until address can drip again. Returns 0 if ready.
    function cooldownRemaining(address user) external view returns (uint256) {
        uint256 elapsed = block.timestamp - lastDrip[user];
        if (elapsed >= cooldown) return 0;
        return cooldown - elapsed;
    }

    /// @notice True if user can drip right now.
    function canDrip(address user) external view returns (bool) {
        return (block.timestamp - lastDrip[user]) >= cooldown;
    }

    // ── Owner ─────────────────────────────────────────────────────────────────

    /// @notice Update drip amount (whole USDC units).
    function setDripAmount(uint256 newAmount) external onlyOwner {
        dripAmount = newAmount;
        emit DripAmountUpdated(newAmount);
    }

    /// @notice Update cooldown window in seconds.
    function setCooldown(uint256 newCooldown) external onlyOwner {
        cooldown = newCooldown;
        emit CooldownUpdated(newCooldown);
    }

    /// @notice Owner can bypass cooldown to drip directly to any address.
    function ownerDrip(address recipient, uint256 amount) external onlyOwner {
        if (recipient == address(0)) revert ZeroAddress();
        usdc.mint(recipient, amount);
        emit Dripped(recipient, amount);
    }
}
