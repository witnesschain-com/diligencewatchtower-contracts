// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

/**
 * @title IAlertManager
 * @author Witness Chain
 * @notice Interface for 
 * - keeping track of alerts raised by watchtowers
 */
interface IAlertManager {
    /// @notice struct used for storing information for alert raised by watchtower
    struct Alert {
        uint256 chainID;
        uint256 l2BlockNumber;
        bytes originalStateRoot;
        bytes computedStateRoot;
        bytes proofOfDiligence;
        address sender;
    }

    /// @notice Emitted when a new alert is raised
    event NewAlertRaised(address sender, uint256 chainID, uint256 l2BlockNumber);

    /// @notice Raise an alert when there is a mismatch in output root
    function raiseAlert(
        uint256 _chainID,
        uint256 _blockNumber,
        bytes calldata _originalOutputRoot,
        bytes calldata _computedOutputRoot,
        bytes calldata _proofOfDiligence
    )
        external;

    /// @notice Get all the alerts raised at a given L2 block number
    function getAlerts(
        uint256 _chainID,
        uint256 _blockNumber
    )
        external
        view
        returns (Alert[] memory alerts);
}