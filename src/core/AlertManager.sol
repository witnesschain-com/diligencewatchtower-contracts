// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import { IAlertManager } from "../interfaces/IAlertManager.sol";
import { IOperatorRegistry } from "./OperatorRegistry.sol";
import { Initializable } from "@openzeppelin-upgrades/contracts/proxy/utils/Initializable.sol";
import { OwnableUpgradeable } from "@openzeppelin-upgrades/contracts/access/OwnableUpgradeable.sol";
import { PausableUpgradeable } from "@openzeppelin-upgrades/contracts/security/PausableUpgradeable.sol";
import { UUPSUpgradeable } from "@openzeppelin-upgrades/contracts/proxy/utils/UUPSUpgradeable.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { IL2ChainMapping } from "./../interfaces/IL2ChainMapping.sol";

/**
 * @title AlertManager
 * @author Witness Chain
 * @notice This contract is used for 
 * - keeping track of alerts raised by watchtowers
 */

contract AlertManager is IAlertManager, Initializable, OwnableUpgradeable, PausableUpgradeable, UUPSUpgradeable {
    using ECDSA for bytes32;

    IOperatorRegistry public registry;

    IL2ChainMapping public l2ChainMapping;

    // watchtower address => last alert raised by watchtower
    mapping(address => Alert) public alertsByAddress;

    // chainID => block number => list of alerts raised
    mapping(uint256 => mapping(uint256 => Alert[])) public alertsByChainIDBlockNumber;

    constructor() {
        _disableInitializers();
    }

    function initialize(IOperatorRegistry _registry,
                        IL2ChainMapping _l2ChainMapping) public initializer {
        __Ownable_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        registry = _registry;
        l2ChainMapping = _l2ChainMapping;
    }

    /// @notice pause the contract
    function pause() public whenNotPaused onlyOwner {
        super._pause();
    }

    /// @notice unpause the contract
    function unpause() public whenPaused onlyOwner {
        super._unpause();
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyOwner
        override
    {}

    /**
     * @notice Raise an alert when there is a mismatch in output root
     * @param _chainID chain ID for the L2 being watched
     * @param _l2BlockNumber L2 block number for which the alert is raised
     * @param _originalOutputRoot observed root hash
     * @param _computedOutputRoot computed root hash by the watchtower
     * @param _proofOfDiligence Proof of Diligence
     */
    function raiseAlert(
        uint256 _chainID,
        uint256 _l2BlockNumber,
        bytes calldata _originalOutputRoot,
        bytes calldata _computedOutputRoot,
        bytes calldata _proofOfDiligence
    )
        external
        whenNotPaused
    {
        // get the operator for watchtower and check if it is active
        require(registry.isValidWatchtower(msg.sender), "WitnessHub: Invalid Watchtower");

        require (l2ChainMapping.isValidChainID(_chainID), "WitnessHub: Invalid Chain ID");

        Alert memory alert = alertsByAddress[msg.sender];

        // update alert struct
        alert.chainID = _chainID;
        alert.l2BlockNumber = _l2BlockNumber;
        alert.originalStateRoot = _originalOutputRoot;
        alert.computedStateRoot = _computedOutputRoot;
        alert.proofOfDiligence = _proofOfDiligence;
        alert.sender = msg.sender;

        alertsByAddress[msg.sender] = alert;

        // update alerts at block number for given chain ID with current alert
        alertsByChainIDBlockNumber[_chainID][_l2BlockNumber].push(alert);

        emit NewAlertRaised(msg.sender, _chainID, _l2BlockNumber);
    }

    /**
     * @notice Get all the alerts raised at a block number for a given chain ID
     * @param _chainID chain ID for the L2 being watched
     * @param _l2BlockNumber L2 block number for which the alert is raised
     */
    function getAlerts(
        uint256 _chainID,
        uint256 _l2BlockNumber
    )
        external
        view
        returns (Alert[] memory alerts)
    {
        return alertsByChainIDBlockNumber[_chainID][_l2BlockNumber];
    }

    /// @notice Sets OperatorRegistry
    function setOperatorRegistry(IOperatorRegistry _registry) external onlyOwner {
        registry = _registry;
    }
}