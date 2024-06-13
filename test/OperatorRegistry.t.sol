pragma solidity ^0.8.15;

import {Test, console2} from "forge-std/Test.sol";
import {IOperatorRegistry, OperatorRegistry, IDelegationManager} from "../src/core/OperatorRegistry.sol";
import {ISlasher} from "eigenlayer-contracts/src/contracts/interfaces/ISlasher.sol";
import {IDelegationManager} from "eigenlayer-contracts/src/contracts/interfaces/IDelegationManager.sol";
import "forge-std/Script.sol";
import "forge-std/console.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

import {SampleSmartWalletOperatorRegistration} from "./SampleSmartWalletOperatorRegistration.sol";

/**
 * Setup the following variables before you run the tests
 * 
 * @dev
   export PRIVATE_KEY=<Private Key used during DeployWatchtower.sol>
   export CHAIN_ID=5 or the forked devnet chain
   export AGGREGATOR=<aggregator eth address>
   export RPC_URL=http://localhost:8545

 * forge test --rpc-url http://127.0.0.1:8545 -vvvv
 * forge test --match-contract OperatorRegistryTest --rpc-url http://127.0.0.1:8545 -vvvv
 */

contract OperatorRegistryTest is Test {
    using ECDSA for bytes32; 
    function readOutput(string memory outputFileName) internal view returns (string memory) {
        string memory chainEnv = vm.envString("CHAIN_ENV");
        string memory inputDir = string.concat(
            vm.projectRoot(),
            "/script/deployment/",
            chainEnv,
            "/output/"
        );
        string memory chainDir = string.concat(vm.toString(block.chainid), "/");
        string memory file = string.concat(outputFileName, ".json");
        return vm.readFile(string.concat(inputDir, chainDir, file));
    }

    OperatorRegistry public operatorRegistry;

    SampleSmartWalletOperatorRegistration sampleSmartWalletOperatorRegistration;

    address SAMPLE_SC_REGISTRATION_PROXY;

    uint256 deployerPrivateKey;

    address[] operatorsList = new address[](2);
    uint256[] operatorsListPrivateKey = new uint256[](2);
    address[] watchtowersList = new address[](2);
    uint256[] watchTowersListPrivateKey = new uint256[](2);
    address[] smartWalletOperatorList = new address[](2);
    

    function signMessage (uint256 signerPrivateKey, address _addr, uint256 expiry) pure internal returns (bytes memory, bytes32, bytes memory )  {
        bytes memory message = abi.encode(_addr,expiry);
        bytes32 messageHash = keccak256(message);
        bytes32 eth_signed_message = messageHash.toEthSignedMessageHash();
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerPrivateKey, eth_signed_message);
        bytes memory signature = abi.encodePacked(r, s, v);
        return (message, messageHash,signature);
    }

    function readTestOutput(string memory outputFileName) internal view returns (string memory) {
        string memory chainEnv = vm.envString("CHAIN_ENV");
        string memory inputDir = string.concat(
            vm.projectRoot(),
            "/test/",
            chainEnv,
            "/output/"
        );
        string memory chainDir = string.concat(vm.toString(block.chainid), "/");
        string memory file = string.concat(outputFileName, ".json");
        return vm.readFile(string.concat(inputDir, chainDir, file));
    }

    function setUp() public {

        deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        string memory configData = readOutput("deployment_output");
        string memory configTestData = readTestOutput("addresses_output");

        address OPERATOR_REGISTRY_PROXY = stdJson.readAddress(configData, ".addresses.OperatorRegistryProxy");

        /**
         * @dev These are addresses on local anvil fork of Goerli
         *      Addresses may differ depending on local run of DeployWatchtowers.s.sol
         *      Please fix accordingly
         */
        operatorRegistry = OperatorRegistry(OPERATOR_REGISTRY_PROXY);

        // Test Operators in EL Goerli Anvil
        operatorsListPrivateKey[0] = 0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97;
        operatorsListPrivateKey[1] = 0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6;

        watchTowersListPrivateKey[0] = 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a;
        watchTowersListPrivateKey[1] = 0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba;


        SAMPLE_SC_REGISTRATION_PROXY = stdJson.readAddress(configTestData, ".addresses.SampleSmartWalletRegistrationProxy");


        sampleSmartWalletOperatorRegistration = SampleSmartWalletOperatorRegistration(SAMPLE_SC_REGISTRATION_PROXY);

        // Get a list of operator addresses
        for (uint256 i = 0; i < 2; i++) {
            operatorsList[i] = vm.addr(operatorsListPrivateKey[i]);
            watchtowersList[i] = vm.addr(watchTowersListPrivateKey[i]);
            smartWalletOperatorList[i] = SAMPLE_SC_REGISTRATION_PROXY;
        }

        // Enable checking if operator is registered for delegation with EigenLayer
        vm.startPrank(vm.addr(deployerPrivateKey));
        operatorRegistry.enableCheckIsDelegatedOperator();
        vm.stopPrank();
    }

    // Pass check
    // Test if whitelisting operators as Owner of the contract works

    function testAddToOperatorWhitelistAsOwner() public {
        assert(operatorRegistry.isWhitelisted(operatorsList[0]) == false);
        assert(operatorRegistry.isWhitelisted(operatorsList[1]) == false);
        vm.startPrank(operatorRegistry.owner());
        operatorRegistry.addToOperatorWhitelist(operatorsList);
        assert(operatorRegistry.isWhitelisted(operatorsList[0]) == true);
        assert(operatorRegistry.isWhitelisted(operatorsList[1]) == true);
        vm.stopPrank();
    }


    /// @notice Following are tests for write functions
    // Fail check
    // Test if whitelisting operators as Non-owner of the contract fails correctly
    function testAddToOperatorWhitelistNotAsOwner() public {
        vm.startPrank(operatorsList[0]);
        vm.expectRevert(bytes("Ownable: caller is not the owner"));
        operatorRegistry.addToOperatorWhitelist(operatorsList);
        vm.stopPrank();
    }
    
    // Pass check
    // Test suspend as Owner
    function testSuspendFromOperatorWhitelistAsOwner() public {
        vm.startPrank(operatorRegistry.owner());
        operatorRegistry.addToOperatorWhitelist(operatorsList);
        assert(operatorRegistry.isWhitelisted(operatorsList[0]) == true);
        assert(operatorRegistry.isWhitelisted(operatorsList[1]) == true);
        operatorRegistry.suspend(operatorsList[0]);
        operatorRegistry.suspend(operatorsList[1]);
        assert(operatorRegistry.isWhitelisted(operatorsList[0]) == false);
        assert(operatorRegistry.isWhitelisted(operatorsList[1]) == false);
        vm.stopPrank();
    }
    // Pass check
    // Test suspend as Owner for non-whitelisted operators
    function testSuspendWithoutOperatorWhitelistAsOwner() public {
        vm.startPrank(operatorRegistry.owner());
        vm.expectRevert(bytes("WitnessHub: Cannot suspend if operator is already suspended or not whitelisted"));
        operatorRegistry.suspend(operatorsList[0]);
        vm.stopPrank();
    }

    // Pass check
    // Test AddtoWhitelist + suspend + AddtoWhitelist
    function testAddSuspendAdd() public {
        vm.startPrank(operatorRegistry.owner());
        operatorRegistry.addToOperatorWhitelist(operatorsList);
        assert(operatorRegistry.isWhitelisted(operatorsList[0]) == true);
        assert(operatorRegistry.isWhitelisted(operatorsList[1]) == true);
        operatorRegistry.suspend(operatorsList[0]);
        assert(operatorRegistry.isWhitelisted(operatorsList[0]) == false);
        assert(operatorRegistry.isWhitelisted(operatorsList[1]) == true);
        operatorRegistry.addToOperatorWhitelist(operatorsList);
        assert(operatorRegistry.isWhitelisted(operatorsList[0]) == true);
        assert(operatorRegistry.isWhitelisted(operatorsList[1]) == true);
        vm.stopPrank();
    }

    // Fail check
    function testSuspendNotAsOwner() public {
        vm.startPrank(operatorsList[0]);
        vm.expectRevert(bytes("Ownable: caller is not the owner"));
        operatorRegistry.suspend(operatorsList[0]);
        vm.stopPrank();
    }

    // Pass check
    // Test successful registration of an operator-watchtower
    function testRegisterPass() public {
        vm.startPrank(operatorRegistry.owner());
        operatorRegistry.addToOperatorWhitelist(operatorsList);
        vm.stopPrank();

        vm.startPrank(operatorsList[0]);
        uint256 expiry = block.number+100000000000;
        (,, bytes memory signedMessage) 
            = signMessage(watchTowersListPrivateKey[0],operatorsList[0],expiry);
        operatorRegistry.registerWatchtowerAsOperator(watchtowersList[0], expiry, signedMessage);
        //validateSigner(abi.encodePacked(operatorsList[0],expiry),signedMessage,watchtowersList[0],operatorsList[0]);
        assertEq(operatorRegistry.isValidWatchtower(watchtowersList[0]),true);
        vm.stopPrank();
    }


    // Fail check
    // Test successful registration of an operator-watchtower with an expired block
    function testRegisterExpiredFail() public {
        vm.startPrank(operatorRegistry.owner());
        operatorRegistry.addToOperatorWhitelist(operatorsList);
        vm.stopPrank();

        vm.startPrank(operatorsList[0]);
        uint256 expiry = block.number-1;
        (,, bytes memory signedMessage) 
            = signMessage(watchTowersListPrivateKey[0],operatorsList[0],expiry);
        vm.expectRevert(bytes("WitnessHub: watchtower signature expired"));
        operatorRegistry.registerWatchtowerAsOperator(watchtowersList[0], expiry, signedMessage);
        vm.stopPrank();
    }

    // Fail check
    function testRegisterOperatorAddressNotWhitelisted() public {
        address notWhitelistedAddress = address(12345);
        vm.startPrank(notWhitelistedAddress);
        vm.expectRevert(bytes("WitnessHub: Operator is not whitelisted with Witness Chain AVS"));
        uint256 expiry = block.number+100000000000;
        (,, bytes memory signedMessage) 
            = signMessage(watchTowersListPrivateKey[0],operatorsList[0],expiry);
        operatorRegistry.registerWatchtowerAsOperator(watchtowersList[0], expiry, signedMessage);
        vm.stopPrank();
    }

    // Fail check
    // Test registration of non-EL operator 
    function testRegisterOperatorAddressNotRegisteredWithEigenLayer() public {
        address[] memory addressList = new address[](1);
        addressList[0] = address(12345);

        vm.startPrank(operatorRegistry.owner());
        operatorRegistry.addToOperatorWhitelist(addressList);
        vm.stopPrank();

        vm.startPrank(addressList[0]);
        vm.expectRevert(bytes("WitnessHub: You need to be a delegated operator with EigenLayer"));
        uint256 expiry = block.number+100000000000;
        (,, bytes memory signedMessage) 
            = signMessage(watchTowersListPrivateKey[0],operatorsList[0],expiry);
        operatorRegistry.registerWatchtowerAsOperator(watchtowersList[0], expiry, signedMessage);
        vm.stopPrank();
    }

    // Pass check
    // Test Deregister for Registered Watchtowers
    function testDeRegisterIfRegistered() public {
        // make msg.sender equal owner to add operator to whitelist
        vm.startPrank(operatorRegistry.owner());
        operatorRegistry.addToOperatorWhitelist(operatorsList);
        vm.stopPrank();

        vm.startPrank(operatorsList[0]);
        uint256 expiry = block.number+100000000000;
        (,, bytes memory signedMessage) 
            = signMessage(watchTowersListPrivateKey[0],operatorsList[0],expiry);
        operatorRegistry.registerWatchtowerAsOperator(watchtowersList[0], expiry, signedMessage);
        bool testDeReg = operatorRegistry.isValidWatchtower(watchtowersList[0]);
        assertEq(testDeReg, true);
        vm.stopPrank();

        // test deregistering operator from operator address
        vm.startPrank(operatorsList[0]);
        operatorRegistry.deRegister(watchtowersList[0]);
        testDeReg = operatorRegistry.isValidWatchtower(watchtowersList[0]);
        assertEq(testDeReg, false);
        vm.stopPrank();
    }

    // Fail check
    // Test Deregister for watchtowers that the operator doesn't own
    function testDeRegisterIfOperatorNotSender() public {
        // make msg.sender equal owner to add operator to whitelist
        vm.startPrank(operatorRegistry.owner());
        operatorRegistry.addToOperatorWhitelist(operatorsList);
        vm.stopPrank();

        vm.startPrank(operatorsList[0]);
        uint256 expiry = block.number+100000000000;
        (,, bytes memory signedMessage) 
            = signMessage(watchTowersListPrivateKey[0],operatorsList[0],expiry);
        operatorRegistry.registerWatchtowerAsOperator(watchtowersList[0], expiry, signedMessage);
        bool testDeReg = operatorRegistry.isValidWatchtower(watchtowersList[0]);
        assertEq(testDeReg, true);
        vm.stopPrank();

        // test deregistering operator from a different address
        vm.startPrank(operatorsList[1]);
        vm.expectRevert(bytes("WitnessHub: Deregistration should be done on operator's registered watchtowers"));
        operatorRegistry.deRegister(watchtowersList[0]);
        vm.stopPrank();
    }

    // Fail check
    // Deregister should fail if the watchtower is not registered
    function testDeRegisterIfNotRegistered() public {
        // try deregistering an operator that is not registered
        vm.expectRevert(bytes("WitnessHub: Deregistration should be done on operator's registered watchtowers"));
        vm.startPrank(operatorsList[1]);
        operatorRegistry.deRegister(watchtowersList[1]);
        vm.stopPrank();
    }

    // Fail Check
    // Test registration for a watchtower already registered
    function testRegisterIfWatchtowerAlreadyRegistered() public {
        vm.startPrank(operatorRegistry.owner());
        operatorRegistry.addToOperatorWhitelist(operatorsList);
        vm.stopPrank();

        vm.startPrank(operatorsList[0]);
        uint256 expiry = block.number+100000000000;
        (,, bytes memory signedMessage) 
            = signMessage(watchTowersListPrivateKey[0],operatorsList[0],expiry);
        operatorRegistry.registerWatchtowerAsOperator(watchtowersList[0], expiry, signedMessage);
        bool isValid = operatorRegistry.isValidWatchtower(watchtowersList[0]);
        assertEq(isValid, true);
        vm.stopPrank();

        vm.startPrank(operatorsList[0]);
        vm.expectRevert(bytes("WitnessHub: Watchtower address already registered"));
        (,, signedMessage) 
            = signMessage(watchTowersListPrivateKey[0],operatorsList[0],expiry);
        operatorRegistry.registerWatchtowerAsOperator(watchtowersList[0], expiry, signedMessage);
        vm.stopPrank();
    }
 
    // Pass check
    // Test if enableCheckIsDelegatedOperator function works
    function testEnableCheckIsDelegatedOperator() public {
        // try deregistering an operator that is not registered
        vm.startPrank(operatorRegistry.owner());
        bool valid = operatorRegistry.checkIsDelegatedOperator();
        assertEq(valid,true);
        vm.stopPrank();
    }

    // Pass check
    // Test if disableCheckIsDelegatedOperator function works
    function testDisableCheckIsDelegatedOperator() public {
        // try deregistering an operator that is not registered
        vm.startPrank(operatorRegistry.owner());
        operatorRegistry.disableCheckIsDelegatedOperator();
        bool valid = operatorRegistry.checkIsDelegatedOperator();
        assertEq(valid,false);
        operatorRegistry.enableCheckIsDelegatedOperator();
        vm.stopPrank();
    }

    // Pass check
    // Test successful registration of a operator-Smart Contract wallet

    function testRegisterSmartContractPass() public {
        vm.startPrank(operatorRegistry.owner());
        operatorRegistry.addToOperatorWhitelist(operatorsList);
        operatorRegistry.addToOperatorWhitelist(smartWalletOperatorList);
        vm.stopPrank();
        
        uint256 watchtower_pk =  watchTowersListPrivateKey[0];
        address watchtower_pubk =  vm.addr(watchTowersListPrivateKey[0]);

        vm.startPrank(watchtower_pubk);
        uint256 expiry = block.number+100000000000;
        (,, bytes memory signedMessage) 
            = signMessage(watchtower_pk,SAMPLE_SC_REGISTRATION_PROXY,expiry);
        sampleSmartWalletOperatorRegistration.registerWatchtowerAsOperator(watchtower_pubk,expiry, signedMessage);
        bool testDeReg = operatorRegistry.isValidWatchtower(watchtower_pubk);
        assertEq(testDeReg, true);
        vm.stopPrank();
    }
}
