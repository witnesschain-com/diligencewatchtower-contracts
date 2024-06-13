// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.15;

import {PausableUpgradeable} from "@openzeppelin-upgrades/contracts/security/PausableUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin-upgrades/contracts/access/OwnableUpgradeable.sol";
import {Initializable} from "@openzeppelin-upgrades/contracts/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin-upgrades/contracts/proxy/utils/UUPSUpgradeable.sol";
import { IDelegationManager } from "eigenlayer-contracts/src/contracts/interfaces/IDelegationManager.sol";
import "@openzeppelin/contracts/interfaces/IERC1271.sol";


import {IOperatorRegistry} from "./../src/interfaces/IOperatorRegistry.sol";


/**
 * @title  Sample Smart Contract Wallet for Operator Registration
 * 
 *  
 * @author Kaleidoscope Blockchain, Inc
 */
contract SampleSmartWalletOperatorRegistration is Initializable, 
                                     OwnableUpgradeable, 
                                     PausableUpgradeable, 
                                     UUPSUpgradeable,
                                     IERC1271 {

    IOperatorRegistry operatorRegistry;

    bytes4 private constant MAGICVALUE = 0x1626ba7e;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(IOperatorRegistry _operatorRegistry) public initializer {
        operatorRegistry = _operatorRegistry;
        __Ownable_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
    }   
  
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function registerOperatorWithEigenlayer(
        address delegationManager,
        address ECDSAAddress
    ) public {
            IDelegationManager.OperatorDetails memory operatorDetails = IDelegationManager.OperatorDetails({
                earningsReceiver: ECDSAAddress,
                delegationApprover: ECDSAAddress,
                stakerOptOutWindowBlocks: 0
            });
            string memory emptyStringForMetadataURI = "testing";
            
            IDelegationManager(delegationManager).registerAsOperator(
                    operatorDetails,
                    emptyStringForMetadataURI
                );
            } 

    function registerWatchtowerAsOperator(
                            address watchtower,
                            uint256 expiry, 
                            bytes memory operatorSignature) external {
        operatorRegistry.registerWatchtowerAsOperator(watchtower,expiry, operatorSignature);
    }  

    function isValidSignature(bytes32 _hash, bytes memory _signature) external view override returns (bytes4) {
        // Check that the signature length is valid
        if (_signature.length != 65) {
            return bytes4(0);
        }

        // Extract the signature parameters
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(_signature, 32))
            s := mload(add(_signature, 64))
            v := byte(0, mload(add(_signature, 96)))
        }

        // Verify the signature
        if (v < 27) {
            v += 27;
        }
        if (v != 27 && v != 28) {
            return bytes4(0);
        }
        address signer = ecrecover(_hash, v, r, s);

        // Perform additional validation if needed
        // For example, compare the signer's address with a whitelist

        // Return the magic value if the signature is valid
        return signer == msg.sender ? MAGICVALUE : bytes4(0);
    }

    
}