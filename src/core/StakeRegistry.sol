// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.15;

import {UUPSUpgradeable} from "@openzeppelin-upgrades/contracts/proxy/utils/UUPSUpgradeable.sol";
import {Initializable} from "@openzeppelin-upgrades/contracts/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin-upgrades/contracts/access/OwnableUpgradeable.sol";
import { PausableUpgradeable } from "@openzeppelin-upgrades/contracts/security/PausableUpgradeable.sol";

import {IStrategy} from "eigenlayer-contracts/src/contracts/interfaces/IStrategy.sol";
import {IStakeRegistry} from "../interfaces/IStakeRegistry.sol";

/**
 * @title A Registry-type contract for keeping track of operator stakes.
 * @author Witness Chain
 * @notice This contract is used for
 * - setting the stake for given strategy
 * - retrieving the stakes
 */
contract StakeRegistry is
    IStakeRegistry,
    Initializable,
    OwnableUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    // Holds mapping between operator and the strategies.
    mapping(address => OperatorStake) private stakeRecord;
    address private clientAddress;

    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __Ownable_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
    }

    /// @notice pause the contract
    function pause() public whenNotPaused onlyOwner {
        super._pause();
    }

    /// @notice unpause the contract
    function unpause() public whenPaused onlyOwner {
        super._unpause();
    }

    function setClient(address _clientAddress) public onlyOwner {
        require(_clientAddress != address(0), "WitnessHub: Invalid client address");
        clientAddress = _clientAddress;
    }

    // drop request when called by any other than stake-sync client
    modifier onlyClient() {
        require(msg.sender == clientAddress, "WitnessHub: Unauthorized");
        _;
    }

    // TBD
    function addStakePlan(
        uint256 chainID,
        uint256 blockNumber,
        StrategyStakeAmount[] memory minimumStrategyStakeAmounts
    ) external override returns (uint16) {}

    // TBD
    function operatorOptInStakePlans(
        address operatorAddress,
        uint16[] memory planIDs,
        uint256 blockNumber
    ) external override {}

    // TBD
    function updateOperatorStakes(
        address operatorAddress,
        uint256 blockNumber,
        StrategyStakeAmount[] memory strategyAmounts
    ) external override onlyClient {}

    /**
     * @notice addOperatorStake - fn called by client initializes all strategies of the given operator
     * @param _operatorAddress address of the operator
     * @param _strategies tuple ( strategy , shares)
     */
    function addOperatorStakes(
        address _operatorAddress,
        StrategyStakeAmount[] memory _strategies
    ) external onlyClient {
        OperatorStake storage record = stakeRecord[_operatorAddress];
        record.blockNumber = block.number;
        for (uint i = 0; i < _strategies.length; i++) {
            record.strategyAmounts[_strategies[i].strategy] = _strategies[i]
                .stakeAmount;
        }
    }

    /**
     * @notice operatorShareIncreased - fn called by client which updates the strategy when there is an increase in share
     * @param _operatorAddress address of the operator
     * @param _strategy Strategy of which the shares were increased
     * @param _shares delta increase in share
     */
    function operatorShareIncreased(
        address _operatorAddress,
        IStrategy _strategy,
        uint256 _shares
    ) external override onlyClient {
        stakeRecord[_operatorAddress].blockNumber = block.number;
        stakeRecord[_operatorAddress].strategyAmounts[_strategy] += _shares;
        emit SharesIncreased(_operatorAddress, _strategy, _shares);
    }

    /**
     * @notice operatorShareDecreased - fn called by client which updates the strategy when there is an decrease in share
     * @param _operatorAddress address of the operator
     * @param _strategy Strategy of which the shares were decreased
     * @param _shares delta decrease in share
     */
    function operatorShareDecreased(
        address _operatorAddress,
        IStrategy _strategy,
        uint256 _shares
    ) external override onlyClient {
        stakeRecord[_operatorAddress].blockNumber = block.number;
        stakeRecord[_operatorAddress].strategyAmounts[_strategy] -= _shares;
        emit SharesDecreased(_operatorAddress, _strategy, _shares);
    }

    /**
     * @notice getOperatorStake - fn returns stake of a given operator for given strategy
     * @param _operatorAddress address of the operator
     * @param _strategy strategy of interest
     */
    function getOperatorStake(
        address _operatorAddress,
        IStrategy _strategy
    ) external view returns (uint256) {
        OperatorStake storage record = stakeRecord[_operatorAddress];
        require(
            record.blockNumber != 0,
            "WitnessHub: Stake Details Unavailable for given operator"
        );
        return record.strategyAmounts[_strategy];
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal virtual override onlyOwner {}
}
