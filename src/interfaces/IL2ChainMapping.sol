// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.15;

/**
 * @title Interface for L2ChainMapping
 * @author Witness Chain
 * @notice See the `L2ChainMapping` contract itself for implementation details.
 */
interface IL2ChainMapping {
    /**
     * @dev Checks if a given chain ID is valid.
     * @param _chainID The chain ID to check.
     * @return A boolean indicating whether the chain ID is valid.
     */
    function isValidChainID(uint256 _chainID) external pure returns (bool);

    /**
     * @dev Gets the latest block number for the specified chain ID.
     * @param _chainID The chain ID to get the latest block number for.
     * @return The latest block number.
     */
    function getLatestBlockNumber(uint256 _chainID) external view returns (uint256);

    /**
     * @dev Gets the list of valid chain IDs
     */
    // function getValidChainIDs() external pure returns (uint256[] memory);
}
