// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import {Types} from "../libraries/Types.sol";
import {IL2ChainMapping} from "./IL2ChainMapping.sol";
import {IOperatorRegistry} from "./IOperatorRegistry.sol";
import {IStrategy} from "eigenlayer-contracts/src/contracts/interfaces/IStrategy.sol";

interface IWitnessHub {
    // rewards update by aggregator by submitting new batch of rewards
    event NewRewardsUpdate(uint256 indexed chainId, uint256 indexed l2BlockNumberEnd, bytes32 indexed rewardHash);

    // rewards update for an address which is not an active operator
    event InvalidOperator(address operator);

    // registry contract address was updated
    event RegistryUpdated(address oldRegistry, address newRegistry);

    // l2chainmapping contract address was updated
    event L2ChainMappingUpdated(address oldL2ChainMapping, address newL2ChainMapping);

    // aggregator address was updated
    event AggregatorUpdated(address oldAggregator, address newAggregator);

    event SetStrategyParams(StrategyParam[] params);

    struct StrategyParam {
        IStrategy strategy;
        uint96 multiplier;
    }

    // update the registry contract address
    function setRegistry(IOperatorRegistry _registry) external;

    // update the l2chainmapping contract address
    function setL2ChainMapping(IL2ChainMapping _l2chainmapping) external;

    // fetch the operator rewards for a particular chain by operator address and chain ID
    function getOperatorRewardsByChainID(address operator, uint256 chainID)
        external
        view
        returns (Types.BountyRewards memory);

    // fetch the start block for next reward update for a chain
    // used by aggregator
    function getNextBlockByChainID(uint256 _chainID) external view returns (uint256);

    // update the aggregator address
    function setAggregatorAddress(address _aggregator) external;

    /// @notice updates reward bounties for a set of block range of a given chain and a list of operators
    function updateReward(
        uint256 _chainID,
        uint256 _blockNumStart,
        uint256 _blockNumEnd,
        address[] calldata _operatorsList,
        Types.BountyRewards[] calldata _proofRewards,
        bytes32 _rewardHash
    ) external;
}
