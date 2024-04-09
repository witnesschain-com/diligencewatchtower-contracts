// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import {IOperatorRegistry} from "../interfaces/IOperatorRegistry.sol";
import {IDelegationManager} from "eigenlayer-contracts/src/contracts/interfaces/IDelegationManager.sol";
import {ISlasher} from "eigenlayer-contracts/src/contracts/interfaces/ISlasher.sol";
import {PausableUpgradeable} from "@openzeppelin-upgrades/contracts/security/PausableUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin-upgrades/contracts/access/OwnableUpgradeable.sol";
import {Initializable} from "@openzeppelin-upgrades/contracts/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin-upgrades/contracts/proxy/utils/UUPSUpgradeable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title A Registry-type contract for keeping track of operators.
 * @author Witness Chain
 * @notice This contract is used for
 * - registering and deregistering new operators
 * - whitelisting operators before registration
 */
contract OperatorRegistry is
    IOperatorRegistry,
    Initializable,
    OwnableUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    using ECDSA for bytes32;

    // operator => operator attributes
    mapping(address => Operator) public operatorDetails;

    // List of all watchtower operators
    address[] private _activeOperators;

    // operator => if operator has been whitelisted (for registration)
    mapping(address => bool) private whitelisted;

    // EigenLayer Delegation Manager
    address public delegationManagerAddress;

    // EigenLayer Slasher Address. Not used currently
    address public slasherAddress;

    // Flag to check if operator has registered for delegation with EigenLayer
    // Set this flag only on L1 as EigenLayer contracts are available on L1 only
    // On L2, this flag will be set to false.
    bool public checkIsDelegatedOperator;

    // watchtower address => operator address
    mapping(address => address) watchtowerToOperator;

    constructor() {
        _disableInitializers();
    }

    function initialize(address _delegationManagerAddress, address _slasherAddress) public initializer {
        delegationManagerAddress = _delegationManagerAddress;
        slasherAddress = _slasherAddress;
        __Ownable_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /**
     * @notice internal func that Validates registration struct is signed by watchtower
     * @param _watchtower the watchtower address
     * @param _registrationHash the ethSignedMessageHash of the registration struct hash
     * @param _signatureOfRegistrationHash watchtower's signature of _registrationHash
     */
    function _validateWatchtowerRegistrationSignature(
        address _watchtower,
        bytes32 _registrationHash,
        bytes memory _signatureOfRegistrationHash
    ) internal pure {
        // recover signer from ethSignedMessageHash and signature of the Registration Struct
        address signer = _registrationHash.recover(_signatureOfRegistrationHash);

        require(signer == _watchtower, "WitnessHub: Registration signer is not the watchtower");
    }

    /**
     * @notice Calculates the ethSignedMessageHash to be signed by watchtower for registration
     * @param operator The account registering watchtower as an operator
     * @param expiry Time after which the watchtower's signature becomes invalid
     */
    function calculateWatchtowerRegistrationMessageHash(address operator, uint256 expiry)
        public
        pure
        returns (bytes32)
    {
        // calculate the struct hash
        bytes32 structHash = keccak256(abi.encode(operator, expiry));

        // get the ethSignedMessageHash
        bytes32 ethSignedMessageHash = structHash.toEthSignedMessageHash();

        return ethSignedMessageHash;
    }

    /**
     * @notice Adds the list of operators to the whitelist mapping.
     * @param operatorsList list of operator addresses to be whitelisted.
     * @dev only callable by the owner of the contract
     */
    function addToOperatorWhitelist(address[] calldata operatorsList) external whenNotPaused onlyOwner {
        uint256 len = operatorsList.length;
        for (uint256 i = 0; i < len;) {
            if (!this.isWhitelisted(operatorsList[i])) {
                whitelisted[operatorsList[i]] = true;
                _activeOperators.push(operatorsList[i]);
            }
            unchecked {
                ++i;
            }
        }
        emit OperatorsWhiteListed(operatorsList, block.number);
    }

    /**
     * @notice Removes the operator from the whitelist mapping.
     * @param operator operator address to be removed from the whitelist.
     * @dev only callable by the owner of the contract
     */
    function _removeFromOperatorWhitelist(address operator) internal {
        for (uint256 i = 0; i < _activeOperators.length;) {
            if (_activeOperators[i] == operator) {
                _activeOperators[i] = _activeOperators[_activeOperators.length - 1];
                _activeOperators.pop();
                break;
            }
            unchecked {
                ++i;
            }
        }
        whitelisted[operator] = false;
    }

    /**
     * @notice Registers a watchtower to an operator. There can be multiple
     *         watchtowers registered under an operator.
     * @param  _watchtowerAddress Eigenlayer delegated operator address or earnings receiver address
     */
    function _register(address _watchtowerAddress) internal {
        // Store the Operator details
        Operator memory newOperator;
        newOperator.operatorAddress = msg.sender;
        newOperator.isActive = true;

        // Add watchtower the list of operator's watchtowers and keep track of all watchtowers
        watchtowerToOperator[_watchtowerAddress] = msg.sender;
        operatorDetails[msg.sender] = newOperator;

        emit WatchtowerRegisteredToOperator(msg.sender, _watchtowerAddress, block.number);
    }

    function registerWatchtowerAsOperator(address watchtower, uint256 expiry, bytes memory signedMessage)
        external
        whenNotPaused
    {
        // check if operator is whitelisted with Witness Chain
        require(whitelisted[msg.sender], "WitnessHub: Operator is not whitelisted with Witness Chain AVS");

        // check if operator has previously registered for delegation with EigenLayer
        if (checkIsDelegatedOperator) {
            bool isDelegatedOperator = IDelegationManager(delegationManagerAddress).isOperator(msg.sender);
            require(isDelegatedOperator, "WitnessHub: You need to be a delegated operator with EigenLayer");
        }

        // check if the watchtower address is already registered
        require(watchtowerToOperator[watchtower] == address(0), "WitnessHub: Watchtower address already registered");

        // check if 0 address is being registered as watchtower (disallow)
        require(watchtower != address(0), "WitnessHub: Watchtower address cannot be the 0 address");

        // check if it's past expiry time already
        require(expiry >= block.timestamp, "WitnessHub: watchtower signature expired");

        // validate the watchtower's signature to the registration
        bytes32 registrationStructHash = calculateWatchtowerRegistrationMessageHash(msg.sender, expiry);
        _validateWatchtowerRegistrationSignature(watchtower, registrationStructHash, signedMessage);

        _register(watchtower);
    }

    /**
     * @notice De-registers the watchtower from the operator's watchtower list.
     * By deregistering, the watchtower will not be able to submit proofs of
     * diligence of proofs of inclusion anymore.
     */
    function deRegister(address watchtowerAddress) external whenNotPaused {
        require(
            watchtowerToOperator[watchtowerAddress] == msg.sender,
            "WitnessHub: Deregistration should be done on operator's registered watchtowers"
        );

        require(whitelisted[msg.sender], "WitnessHub: Deregistration can be done only on whitelisted operators");

        delete watchtowerToOperator[watchtowerAddress];

        emit WatchtowerDeRegisteredFromOperator(msg.sender, watchtowerAddress, block.number);
    }

    /**
     * @notice Makes an operator inactive. This will stop all the watchtowers
     * under an operator inactive. None of the watchtowers for the operator
     * will be able to submit proofs
     *
     */
    function suspend(address operatorAddress) external whenNotPaused onlyOwner {
        require(
            whitelisted[operatorAddress],
            "WitnessHub: Cannot suspend if operator is already suspended or not whitelisted"
        );

        _removeFromOperatorWhitelist(operatorAddress);

        Operator memory currentOperator;
        currentOperator.operatorAddress = operatorAddress;
        currentOperator.isActive = false;

        operatorDetails[operatorAddress] = currentOperator;

        emit OperatorSuspended(operatorAddress, block.number);
    }

    /// @notice Enable the check for operator delegation with EL
    function enableCheckIsDelegatedOperator() external onlyOwner {
        require(!checkIsDelegatedOperator, "WitnessHub: EL delegation check is already enabled");
        checkIsDelegatedOperator = true;
    }

    /// @notice Disable the check for operator delegation with EL
    function disableCheckIsDelegatedOperator() external onlyOwner {
        require(checkIsDelegatedOperator, "WitnessHub: EL delegation check is already disabled");
        checkIsDelegatedOperator = false;
    }

    /// @notice Returns whether or not the `operator` is currently an active operator
    function isActiveOperator(address operator) public view virtual returns (bool) {
        return whitelisted[operator];
    }

    /// @notice Returns whether or not the `watchtower` is a registered with an active operator
    function isValidWatchtower(address watchtower) external view returns (bool) {
        require(watchtower != address(0), "WitnessHub: Watchtower address cannot be 0");
        address operator = watchtowerToOperator[watchtower];
        if (operator == address(0)) {
            return false;
        }
        return isActiveOperator(operator);
    }

    /// @notice Return the operator address for the given watchtower address
    function getOperator(address watchtower) external view returns (address operator) {
        return watchtowerToOperator[watchtower];
    }

    /// @notice Returns the addresses of all the registered watchtowers
    function getAllActiveOperators() external view returns (address[] memory) {
        return _activeOperators;
    }

    function isWhitelisted(address operator) external view returns (bool) {
        return whitelisted[operator];
    }

    /// @notice Sets the Delegation Manager Address
    function setDelegationManagerAddress(address _delegationManagerAddress) external whenNotPaused onlyOwner {
        delegationManagerAddress = _delegationManagerAddress;
    }

    /// @notice Sets the Slasher Address
    function setSlasherAddress(address _slasherAddress) external whenNotPaused onlyOwner {
        slasherAddress = _slasherAddress;
    }
}
