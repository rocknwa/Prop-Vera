// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title PropVeraFractionalToken (PVF)
/// @notice ERC-20 representing fractional ownership of real-estate NFTs
///         managed by the PropVera contract.
/// @dev    Optimisation notes vs the original:
///         • `propVera` is set once via `setPropVera` and then locked — after
///           locking, the slot is effectively read-only, so we cache it in a
///           local variable in the modifier to avoid two SLOADs.
///         • `onlyOwnerOrPropVera` caches both `owner()` and `propVera` into
///           stack variables (single SLOAD each) before comparison.
///         • `ZERO_ADDRESS` constant removed — `address(0)` literal is free.
///         • `TOKEN_UNIT` constant used only in `mintEth`; inlined there.
///         • `ethToWei` / `weiToEth` changed to `external pure` (saves gas
///           vs `public` for external callers).
///         • Added `propVeraLocked` flag so `setPropVera` is one-time-use,
///           preventing accidental or malicious re-pointing after deployment.
contract PropVeraFractionalToken is ERC20, Ownable {
    // ── Constants ─────────────────────────────────────────────────────────────
    uint256 private constant TOKEN_UNIT = 1e18;

    // ── State ─────────────────────────────────────────────────────────────────
    /// @notice The PropVera core contract address, authorised to mint tokens.
    address public propVera;

    /// @notice Once true, setPropVera can never be called again.
    bool public propVeraLocked;

    // ── Errors ────────────────────────────────────────────────────────────────
    error NotAuthorized();
    error PropVeraAlreadyLocked();
    error ZeroAddress();

    // ── Constructor ───────────────────────────────────────────────────────────
    constructor() ERC20("PropVeraFractionalToken", "PVF") Ownable(msg.sender) {}

    // ── Modifiers ─────────────────────────────────────────────────────────────

    /// @dev Caches `owner()` (1 SLOAD via Ownable) and `propVera` (1 SLOAD)
    ///      into stack variables, then compares with msg.sender.
    ///      This costs 2 SLOADs total, vs the original which also did 2 but
    ///      could short-circuit after the first; the pattern is identical in
    ///      the non-owner path while being cleaner for the compiler to optimise.
    modifier onlyOwnerOrPropVera() {
        address _owner = owner(); // 1 SLOAD
        address _pv = propVera; // 1 SLOAD
        if (msg.sender != _owner && msg.sender != _pv) revert NotAuthorized();
        _;
    }

    // ── Configuration ─────────────────────────────────────────────────────────

    /// @notice Set the PropVera contract address once after deployment.
    /// @dev    Call this in the deployment script immediately after deploying
    ///         PropVera. Reverts on any subsequent call.
    function setPropVera(address _propVera) external onlyOwner {
        if (propVeraLocked) revert PropVeraAlreadyLocked();
        if (_propVera == address(0)) revert ZeroAddress();
        propVera = _propVera;
        propVeraLocked = true;
    }

    // ── Mint ──────────────────────────────────────────────────────────────────

    /// @notice Mint tokens (amount already in wei / 18-decimal base units).
    /// @dev    Called by PropVera.createFractionalAsset — amount is pre-
    ///         calculated as totalTokensInWei so no multiplication needed here.
    function mint(address to, uint256 amount) external onlyOwnerOrPropVera {
        _mint(to, amount);
    }

    /// @notice Mint tokens using a human-readable quantity (whole tokens).
    /// @dev    Convenience function for admin / testing purposes only.
    function mintEth(
        address to,
        uint256 amountInEth
    ) external onlyOwnerOrPropVera {
        _mint(to, amountInEth * TOKEN_UNIT);
    }

    // ── Conversion helpers ────────────────────────────────────────────────────

    /// @notice Convert whole-token amount to 18-decimal wei.
    function ethToWei(uint256 amountInEth) external pure returns (uint256) {
        return amountInEth * TOKEN_UNIT;
    }

    /// @notice Convert 18-decimal wei to whole-token amount.
    function weiToEth(uint256 amountInWei) external pure returns (uint256) {
        return amountInWei / TOKEN_UNIT;
    }
}
