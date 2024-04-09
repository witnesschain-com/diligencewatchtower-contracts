// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.15;

/**
 * @title Interface for a Registry-type contract for keeping track of operators.
 * @author Witness Chain
 * @notice See the `OperatorRegistry` contract itself for implementation details.
 */
interface IOperatorRegistry {
    /**
     * this struct keeps track of operator attributes
     * struct components include
     * - isActive:      is the operator active (make inactive in case of malicious activity)
     * - operatorAddress:  EigenLayer operator address
     */
    struct Operator {
        address operatorAddress;
        bool isActive;
    }

    /// @notice Emitted once a watchtower is registered to an operator
    event WatchtowerRegisteredToOperator(address operator, address watchtower, uint256 blockNumber);

    /// @notice Emitted once a watchtower is deregistered from an operator
    event WatchtowerDeRegisteredFromOperator(address operator, address watchtower, uint256 blockNumber);

    /// @notice Emitted once an operator has been suspended
    event OperatorSuspended(address operator, uint256 blockNumber);

    /// @notice Emitted once an operator has been whitelisted
    event OperatorsWhiteListed(address[] operator, uint256 blockNumber);

    function calculateWatchtowerRegistrationMessageHash(address operator, uint256 expiry)
        external
        view
        returns (bytes32);

    /// @notice Adds the list of operators to the whitelisted list of EL operators.
    function addToOperatorWhitelist(address[] calldata operatorsList) external;

    /// @notice Registers a watchtower to an operator. There can be multiple
    /// watchtowers registered under an operator.
    function registerWatchtowerAsOperator(address watchtower, uint256 expiry, bytes memory signedMessage) external;

    /**
     * @notice Deregisters the watchtower from the operator's watchtower list.
     * By deregistering, the watchtower will not be able to submit proofs of
     * diligence of proofs of inclusion anymore.
     */
    function deRegister(address watchtowerAddress) external;

    /**
     * @notice Makes an operator inactive. This will stop all the watchtowers
     * under an operator inactive. None of the watchtowers for the operator
     * will be able to submit proofs
     *
     */
    function suspend(address operatorAddress) external;

    /// @notice Enable the check for operator delegation with EL
    function enableCheckIsDelegatedOperator() external;

    /// @notice Disable the check for operator delegation with EL
    function disableCheckIsDelegatedOperator() external;

    /// @notice Returns whether or not the `operator` is currently an active operator
    function isActiveOperator(address operator) external view returns (bool);

    /// @notice Returns whether or not the `watchtower` is a valid watchtower
    function isValidWatchtower(address watchtower) external view returns (bool);

    /// @notice Return the operator address for the given watchtower address
    function getOperator(address watchtower) external view returns (address operator);

    /// @notice Returns all the operators watching
    function getAllActiveOperators() external view returns (address[] memory);

    /// @notice Sets the Delegation Manager Address
    function setDelegationManagerAddress(address _delegationManagerAddress) external;

    /// @notice Sets the Slasher Address
    function setSlasherAddress(address _slasherAddress) external;
}
