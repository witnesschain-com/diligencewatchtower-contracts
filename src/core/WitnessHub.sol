// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import {Initializable} from "@openzeppelin-upgrades/contracts/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin-upgrades/contracts/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin-upgrades/contracts/security/PausableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin-upgrades/contracts/proxy/utils/UUPSUpgradeable.sol";

import {IWitnessHub} from "../interfaces/IWitnessHub.sol";
import {IOperatorRegistry} from "../interfaces/IOperatorRegistry.sol";
import {IL2ChainMapping} from "../interfaces/IL2ChainMapping.sol";
import {Types} from "../libraries/Types.sol";

import {ISignatureUtils} from "eigenlayer-contracts/src/contracts/interfaces/ISignatureUtils.sol";
import {IAVSDirectory} from "eigenlayer-contracts/src/contracts/interfaces/IAVSDirectory.sol";
import {IServiceManager} from "eigenlayer-middleware/src/interfaces/IServiceManager.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title  WitnessHub
 * @notice The WitnessHub Contract contains functionality for
 *          aggregator to submit the aggregated Proofs of Diligence and
 *          Proofs of Inclusion submitted by watchtowers on an L2 chain
 *          for a Bounty Period (which is the period between 2 L2 Txns
 *          submissions).
 */
contract WitnessHub is
    IWitnessHub,
    IServiceManager,
    Initializable,
    OwnableUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    using ECDSA for bytes32;

    /// @notice The instance address of registry contract. Can be updated by owner.
    IOperatorRegistry public registry;

    /// @notice The instance address of l2chainmapping contract. Can be updated by owner.
    IL2ChainMapping public l2ChainMapping;

    /// @notice The address of the aggregator. Can be updated by owner.
    address public aggregator;

    /// @notice The instance address of avsDirectory contract
    IAVSDirectory internal immutable _avsDirectory;

    /// @notice The EL strategy param storage
    StrategyParam[] strategyParams;

    /// @notice A mapping of operator reward bounties per chain
    mapping(uint256 => Types.ChainRewards) public operatorRewards;

    /// @notice An array of aggregator commitments (reward updates commitments)
    Types.AggProofCommitment[] public _proofCommitments;

    /// @notice modifier to allow only aggregator address to access methods
    modifier onlyAggregator() {
        require(msg.sender == aggregator, "WitnessHub: You are not the aggregator!");
        _;
    }

    /// @notice Constructs the WitnessHub contract. Initializes variables to during deployment
    constructor(IAVSDirectory __avsDirectory) {
        _avsDirectory = __avsDirectory;
        _disableInitializers();
    }

    /// @notice Initializer.
    /// @param _registry The address of the witnessChain operator registry contract
    /// @param _l2ChainMapping The address of the witnessChain l2chainmapping contract
    /// @param _agg The address of the aggregator
    function initialize(IOperatorRegistry _registry, IL2ChainMapping _l2ChainMapping, address _agg)
        public
        initializer
    {
        registry = _registry;
        l2ChainMapping = _l2ChainMapping;
        aggregator = _agg;
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

    /// @notice allows owner to upgrade the implementation contract
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /// @notice Setter for the registry
    /// @notice only contract owner can call this to update the registry
    function setRegistry(IOperatorRegistry _registry) external onlyOwner {
        require(address(registry) != address(_registry), "WitnessHub: Registry already set to this address");
        address previousRegistry = address(registry);
        registry = _registry;
        emit RegistryUpdated(previousRegistry, address(_registry));
    }

    /// @notice Setter for the l2chainmapping
    /// @notice only contract owner can call this to update the l2chainmapping
    function setL2ChainMapping(IL2ChainMapping _l2chainmapping) external onlyOwner {
        require(address(_l2chainmapping) != address(_l2chainmapping), "WitnessHub: L2ChainMapping already set to this address");        
        address previousL2ChainMapping = address(l2ChainMapping);
        l2ChainMapping = _l2chainmapping;
        emit L2ChainMappingUpdated(previousL2ChainMapping, address(_l2chainmapping));
    }

    /// @notice Setter for the aggregator
    /// @notice only contract owner can call this to update the aggregator
    function setAggregatorAddress(address _aggregator) external onlyOwner {
        require(address(aggregator) != address(_aggregator), "WitnessHub: Aggregator already set to this address");
        address previousAggregator = aggregator;
        aggregator = _aggregator;
        emit AggregatorUpdated(previousAggregator, _aggregator);
    }

    // @notice Updates the metadata URI for the AVS
    // @param _metadataURI is the metadata URI for the AVS
    // @dev only callable by the owner
    function updateAVSMetadataURI(string memory _metadataURI) public virtual onlyOwner {
        _avsDirectory.updateAVSMetadataURI(_metadataURI);
    }

    // @notice Forwards a call to EigenLayer's AVSDirectory contract to confirm operator registration with the AVS
    // @param operator The address of the operator to register.
    // @param operatorSignature The signature, salt, and expiry of the operator's signature.
    function registerOperatorToAVS(
        address operator,
        ISignatureUtils.SignatureWithSaltAndExpiry memory operatorSignature
    ) external whenNotPaused {
        require(registry.isActiveOperator(operator), "WitnessHub: Operator should be active WC operator");
        _avsDirectory.registerOperatorToAVS(operator, operatorSignature);
    }

    // @notice Forwards a call to EigenLayer's AVSDirectory contract to confirm operator deregistration from the AVS
    // @param operator The address of the operator to deregister.
    function deregisterOperatorFromAVS(address operator) external whenNotPaused {
        require(
            msg.sender == operator || msg.sender == owner(), "WitnessHub: Operator or owner should be the sender"
        );
        require(registry.isActiveOperator(operator), "WitnessHub: Operator should be active WC operator");
        _avsDirectory.deregisterOperatorFromAVS(operator);
    }

    /// @notice Returns the EigenLayer AVSDirectory contract.
    function avsDirectory() external view override returns (address) {
        return address(_avsDirectory);
    }

    /// @notice Method to get an operator's rewards for a particular chain
    /// @return BountyRewards The operator's PoI rewards and PoD rewards for chainID
    /// @param  _operator   The operator whose rewards are to be fetched
    /// @param  _chainID    The chain ID for which the operator rewards are needed
    function getOperatorRewardsByChainID(address _operator, uint256 _chainID)
        external
        view
        returns (Types.BountyRewards memory)
    {
        /// can only submit rewards to chain ids present on the l2chainmapping contract
        require(l2ChainMapping.isValidChainID(_chainID), "WitnessHub: Invalid Chain ID");
        return operatorRewards[_chainID].currentOperatorRewards[_operator];
    }

    /// @notice Method used by aggregator to get the start block for next reward update for a chain
    function getNextBlockByChainID(uint256 _chainID) public view returns (uint256) {
        if (operatorRewards[_chainID].lastUpdateBlock == 0) {
            return 0;
        }
        return operatorRewards[_chainID].lastUpdateBlock + 1;
    }

    /// @notice Accepts a list of operators and proof rewards, which correspond to the
    ///         aggregated rewards for the operators across their watchtowers's proof submissions
    ///         for a particular chain id and a range of blocks.
    ///         This function may only be called by the aggregator.
    /// @param _chainID         The chain id of the L2 to update it's watcher rewards
    /// @param _blockNumBegin   The first L2 block number in the range of blocks for reward updates
    /// @param _blockNumEnd     The last L2 block number in the range of blocks for reward updates
    /// @param _operatorsList   The list of operators to update rewards for
    /// @param _proofRewards    The reward bounties awarded to operators in the operator list
    ///                         (_proofRewards[i] corresponds to rewards for operator at _operatorsList[i])
    /// @param _rewardHash      The reward hash of the aggregator commitment to watchtower rewards
    function updateReward(
        uint256 _chainID,
        uint256 _blockNumBegin,
        uint256 _blockNumEnd,
        address[] calldata _operatorsList,
        Types.BountyRewards[] calldata _proofRewards,
        bytes32 _rewardHash
    ) external whenNotPaused onlyAggregator {
        /// can only submit rewards to chainid ids present on the l2chainmapping contract
        require(l2ChainMapping.isValidChainID(_chainID), "WitnessHub: Invalid Chain ID");

        require (_blockNumBegin < _blockNumEnd , "WitnessHub: _blockNumBegin should be less than _blockNumEnd");

        require(_operatorsList.length == _proofRewards.length, "WitnessHub: unequal operators and reward list length");

        require(_blockNumBegin == getNextBlockByChainID(_chainID), "WitnessHub: Incorrect _blockNumBegin");

        // update the rewards for the operator
        for (uint256 i; i < _proofRewards.length;) {
            if (registry.isActiveOperator(_operatorsList[i])) {
                operatorRewards[_chainID].currentOperatorRewards[_operatorsList[i]].inclusionProofBounties +=
                    _proofRewards[i].inclusionProofBounties;
                operatorRewards[_chainID].currentOperatorRewards[_operatorsList[i]].diligenceProofBounties +=
                    _proofRewards[i].diligenceProofBounties;
            } else {
                // operator address not found in active operator list on the registry contract
                emit InvalidOperator(_operatorsList[i]);
                revert("WitnessHub: Inactive operator");
            }
            unchecked {
                ++i;
            }
        }

        operatorRewards[_chainID].lastUpdateBlock = _blockNumEnd;
        emit NewRewardsUpdate(_chainID, _blockNumEnd, _rewardHash);

        // store the proof commitment
        _proofCommitments.push(
            Types.AggProofCommitment({
                chainID: _chainID,
                l2BlockNumberBegin: _blockNumBegin,
                l2BlockNumberEnd: _blockNumEnd,
                rewardHash: _rewardHash,
                submissionBlock: block.number
            })
        );
    }

    function setStrategyParams(StrategyParam[] calldata params) external whenNotPaused {
        require(msg.sender == owner(), "WitnessHub: Owner should be the sender");

        delete strategyParams;

        for (uint256 i = 0; i < params.length;) {
            require(address(params[i].strategy) != address(0), "WitnessHub:  no Null strategies");

            strategyParams.push(params[i]);

            unchecked {
                ++i;
            }
        }

        emit SetStrategyParams(params);
    }

    // No quorum in Witness Chain. So both the functions call the same set of strategies
    function getRestakeableStrategies() external view returns (address[] memory) {
        return _getRestakeableStrategies();
    }

    // No quorum in Witness Chain. So both the functions call the same set of strategies
    function getOperatorRestakedStrategies(address operator) external view returns (address[] memory) {
        return _getRestakeableStrategies();
    }

    function _getRestakeableStrategies() internal view returns (address[] memory) {
        address[] memory strategies = new address[](strategyParams.length);
        for (uint256 i = 0; i < strategyParams.length;) {
            strategies[i] = address(strategyParams[i].strategy);
            unchecked {
                ++i;
            }
        }
        return strategies;
    }
}
