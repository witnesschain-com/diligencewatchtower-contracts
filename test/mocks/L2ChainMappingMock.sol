// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

//import { L2OutputOracle } from "@optimism/packages/contracts-bedrock/contracts/L1/L2OutputOracle.sol";
import { Test, console2 } from "forge-std/Test.sol";
import { IL2ChainMapping } from "./../../src/interfaces/IL2ChainMapping.sol";

/**
 * @title  L2ChainMapping
 * @author Witness Chain
 * @notice This contract is used for holding the mappings for the L2OO contract on different testnet chains
 * - 
 */
contract L2ChainMappingMock is  IL2ChainMapping, Test {
    // address for L2 Output Oracle for Optimism on Mainnet (L1);
    address public immutable MainnetL2OOAddressOptimism;
    // address for L2 Output Oracle for Base on Mainnet (L1);
    address public immutable MainnetL2OOAddressBase;

    // address for L2 Output Oracle for Optimism on Goerli (L1);
    address public immutable GoerliL2OOAddressOptimism;
    // address for L2 Output Oracle for Base on Goerli (L1);
    address public immutable GoerliL2OOAddressBase;

    // address for L2 Output Oracle for Optimism on Sepolia (L1);
    address public immutable SepoliaL2OOAddressOptimism;
    // address for L2 Output Oracle for Base on Sepolia (L1);
    address public immutable SepoliaL2OOAddressBase;

    uint256 MAINNET_OPTIMISM_BLOCKS = 120;
    uint256 MAINNET_BASE_BLOCKS = 120;
    uint256 GOERLI_OPTIMISM_BLOCKS = 120;
    uint256 GOERLI_BASE_BLOCKS = 120;
    uint256 SEPOLIA_OPTIMISM_BLOCKS = 120;
    uint256 SEPOLIA_BASE_BLOCKS = 120;

    /**
     * @dev Constructor to set L2OutputOracle addresses during deployment.
    */
    constructor(
        address _mainnetL2OOAddressOptimism,
        address _mainnetL2OOAddressBase,
        address _goerliL2OOAddressOptimism,
        address _goerliL2OOAddressBase,
        address _sepoliaL2OOAddressOptimism,
        address _sepoliaL2OOAddressBase
    )
    {
        MainnetL2OOAddressOptimism = _mainnetL2OOAddressOptimism;
        MainnetL2OOAddressBase = _mainnetL2OOAddressBase;
        GoerliL2OOAddressOptimism = _goerliL2OOAddressOptimism;
        GoerliL2OOAddressBase = _goerliL2OOAddressBase;
        SepoliaL2OOAddressOptimism = _sepoliaL2OOAddressOptimism;
        SepoliaL2OOAddressBase = _sepoliaL2OOAddressBase;
    }

    /**
     * @dev Checks if a given chain ID is valid.
     * @param _chainID The chain ID to check.
     * @return A boolean indicating whether the chain ID is valid.
     */
    function isValidChainID(uint256 _chainID) external pure returns (bool) {
        return _chainID == 420 || _chainID == 84531 || _chainID == 11155420 || _chainID == 84532;
    }

    /**
     * @dev Gets the latest block number for the specified chain ID.
     * @param _chainID The chain ID to get the latest block number for.
     * @return The latest block number.
     */
    function getLatestBlockNumber(uint256 _chainID) public pure returns(uint256) {
        /**
        if (_chainID == 10) {               // 10 ChainID is Optimism Mainnet
            return L2OutputOracle(MainnetL2OOAddressOptimism).latestBlockNumber() + MAINNET_OPTIMISM_BLOCKS;
        } else if (_chainID == 8453) {      // 8453 ChainID is Base Mainnet
            return L2OutputOracle(MainnetL2OOAddressBase).latestBlockNumber() + MAINNET_BASE_BLOCKS;
        } else if (_chainID == 420) {              // 420 ChainID is Optimism Goerli
            return L2OutputOracle(GoerliL2OOAddressOptimism).latestBlockNumber() + GOERLI_OPTIMISM_BLOCKS;
        } else if (_chainID == 84531) {     // 84531 ChainID is Base Goerli
            return L2OutputOracle(GoerliL2OOAddressBase).latestBlockNumber() + GOERLI_BASE_BLOCKS;
        } else if (_chainID == 11155420) {  // 11155420 ChainID is Optimism Sepolia
            return L2OutputOracle(SepoliaL2OOAddressOptimism).latestBlockNumber() + SEPOLIA_OPTIMISM_BLOCKS;
        } else if (_chainID == 84532) {     // 84532 ChainID is Base Sepolia
            return L2OutputOracle(SepoliaL2OOAddressBase).latestBlockNumber() + SEPOLIA_BASE_BLOCKS;
        } else {
            // This should not happen due to the isValidChainID check.
            revert("Unexpected error");
        }
         */
        revert("L2ChainMappingMock.getLatestBlockNumber: Deprecated");
    }
}