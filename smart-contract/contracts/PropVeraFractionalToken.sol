// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title PropVeraFractionalToken
/// @notice An ERC20 token representing fractional ownership in real estate assets managed by the PropVera contract.
/// @dev Extends OpenZeppelin's ERC20 and Ownable. Minting is restricted to the contract owner or the PropVera contract.
/// Used for fractionalizing real estate NFTs in the PropVera ecosystem.
/// Users pass amounts in ETH, contract mints in wei (18 decimals)
contract PropVeraFractionalToken is ERC20, Ownable {
    // --- Constants ---
    /// @notice Zero address for validation.
    address private constant ZERO_ADDRESS = address(0);
    uint256 private constant TOKEN_UNIT = 1e18; // 1 Token in wei

    // --- State Variables ---
    /// @notice Address of the PropVera contract authorized to mint tokens.
    address public propVera;

    // --- Custom Errors ---
    /// @notice Thrown when an unauthorized caller attempts to perform a restricted action.
    error NotAuthorized();

    // --- Constructor ---
    /// @notice Initializes the ERC20 token with name "PropVeraFractionalToken" and symbol "PVF".
    constructor() ERC20("PropVeraFractionalToken", "PVF") {}

    // --- Modifiers ---
    /// @notice Restricts access to the contract owner or the PropVera contract.
    modifier onlyOwnerOrPropVera() {
        if (msg.sender != owner() && msg.sender != propVera) revert NotAuthorized();
        _;
    }

    // --- Functions ---
    /// @notice Sets the address of the PropVera contract.
    /// @dev Only callable by the contract owner. Updates the address authorized to mint tokens.
    /// @param _propVera The address of the PropVera contract.
    function setPropVera(address _propVera) external onlyOwner {
        propVera = _propVera;
    }

    /// @notice Mints new tokens to a specified address (accepts wei directly from PropVera contract)
    /// @dev Only callable by the contract owner or the PropVera contract. Uses ERC20's internal _mint.
    /// @param to The address to receive the minted tokens.
    /// @param amount The number of tokens to mint in wei (18 decimals).
    function mint(address to, uint256 amount) external onlyOwnerOrPropVera {
        _mint(to, amount);
    }

    /// @notice Mints tokens with ETH input (for testing/admin purposes)
    /// @dev Converts ETH amount to wei automatically. Only callable by owner or PropVera.
    /// @param to The address to receive the minted tokens.
    /// @param amountInEth The number of tokens to mint in ETH (will be converted to wei).
    function mintEth(address to, uint256 amountInEth) external onlyOwnerOrPropVera {
        uint256 amountInWei = amountInEth * TOKEN_UNIT;
        _mint(to, amountInWei);
    }

    /// @notice Convert ETH amount to wei
    /// @param amountInEth Amount in ETH
    /// @return Amount in wei (18 decimals)
    function ethToWei(uint256 amountInEth) public pure returns (uint256) {
        return amountInEth * TOKEN_UNIT;
    }

    /// @notice Convert wei amount to ETH
    /// @param amountInWei Amount in wei (18 decimals)
    /// @return Amount in ETH
    function weiToEth(uint256 amountInWei) public pure returns (uint256) {
        return amountInWei / TOKEN_UNIT;
    }
}