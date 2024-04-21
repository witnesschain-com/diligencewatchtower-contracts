// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.15;

import { Test, console2 } from "forge-std/Test.sol";
import { DiligenceProofManager, IDiligenceProofManager } from "../src/core/DiligenceProofManager.sol";
import { OperatorRegistry } from "../src/core/OperatorRegistry.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { L2ChainMapping } from "../src/core/L2ChainMapping.sol";
import { IL2ChainMapping } from "../src/interfaces/IL2ChainMapping.sol";
import "forge-std/Script.sol";
import "forge-std/console.sol";

import { L2ChainMappingMock } from "./mocks/L2ChainMappingMock.sol";

/**
 * Setup the following variables before you run the tests
 * 
 * @dev
   export PRIVATE_KEY=<Private Key used during DeployWatchtower.sol>
   export CHAIN_ID=5 or the forked devnet chain
   export AGGREGATOR=<AGGREGATOR_ADDRESS> or some aggregator address
   export RPC_URL=http://localhost:8545

 * forge test --rpc-url http://127.0.0.1:8545 -vvvv
 * forge test --match-contract DiligenceProofManagerTest --rpc-url http://127.0.0.1:8545 -vvvv
 */

contract DiligenceProofManagerTest is Test {
    using ECDSA for bytes32;

    OperatorRegistry public operatorRegistry;

    address[] operatorsList = new address[](2);
    uint256[] operatorsListPrivateKey = new uint256[](2);
    address[] watchtowersList = new address[](2);
    uint256[] watchtowersListPrivateKey = new uint256[](2);

    address mainnetL2OOAddressOptimism;
    address mainnetL2OOAddressBase;
    address goerliL2OOAddressOptimism;
    address goerliL2OOAddressBase;
    address sepoliaL2OOAddressOptimism;
    address sepoliaL2OOAddressBase;

    L2ChainMapping public l2ChainMapping;

    uint256 _chainID = 420; // OP Goerli ChainID
    
    DiligenceProofManager public diligence;

    uint256 REWARD_BLOCKS = 120;

    uint256 deployerPrivateKey;

    enum BountyState { 
        Configured, 
        Initialized, 
        InProgress, 
        Rewarded 
        }
    BountyState                   public currentBountyStatus;
  
    struct Bounty {
        uint256 l2BlockNumber;
        uint256 claimBounties;
        mapping(address => bytes32) minerStateRoots;
        address winner;
        BountyState status;
    }

    function readOutput(
        string memory outputFileName
    ) internal view returns (string memory) {
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

    function signMessage (uint256 signerPrivateKey, address _addr, uint256 expiry) pure internal returns (bytes memory, bytes32, bytes memory )  {
        bytes memory message = abi.encode(_addr,expiry);
        bytes32 messageHash = keccak256(message);
        bytes32 eth_signed_message = messageHash.toEthSignedMessageHash();
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerPrivateKey, eth_signed_message);
        bytes memory signature = abi.encodePacked(r, s, v);
        return (message, messageHash,signature);
    }

    function readInput(
        string memory outputFileName
    ) internal view returns (string memory) {
        string memory chainEnv = vm.envString("CHAIN_ENV");
        string memory inputDir = string.concat(
            vm.projectRoot(),
            "/script/deployment/",
            chainEnv,
            "/input/"
        );
        string memory chainDir = string.concat(vm.toString(block.chainid), "/");
        string memory file = string.concat(outputFileName, ".json");
        return vm.readFile(string.concat(inputDir, chainDir, file));
    }

    function setUp() public {
        deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        string memory configData = readOutput("deployment_output");

        address OPERATOR_REGISTRY_PROXY = stdJson.readAddress(configData, ".addresses.OperatorRegistryProxy");
        address DILIGENCE_MANAGER_PROXY = stdJson.readAddress(configData, ".addresses.DiligenceProofManagerProxy");
        address L2CHAINMAPPING          = stdJson.readAddress(configData, ".addresses.l2ChainMapping");

        string memory externalData = readInput("addresses_input");

        // Addresses used in L2ChainMappingMock constructor
        mainnetL2OOAddressOptimism = address(stdJson.readAddress(externalData, ".addresses.MainnetL2OOOptimism"));
        mainnetL2OOAddressBase = address(stdJson.readAddress(externalData, ".addresses.MainnetL2OOBase"));
        goerliL2OOAddressOptimism = address(stdJson.readAddress(externalData, ".addresses.GoerliL2OOOptimism"));
        goerliL2OOAddressBase = address(stdJson.readAddress(externalData, ".addresses.GoerliL2OOBase"));
        sepoliaL2OOAddressOptimism = address(stdJson.readAddress(externalData, ".addresses.SepoliaL2OOOptimism"));
        sepoliaL2OOAddressBase = address(stdJson.readAddress(externalData, ".addresses.SepoliaL2OOBase"));

        // Whitelist operators and register with Witness Chain Watchtower
        operatorRegistry = OperatorRegistry(OPERATOR_REGISTRY_PROXY);

        l2ChainMapping = L2ChainMapping(L2CHAINMAPPING);

        diligence = DiligenceProofManager(DILIGENCE_MANAGER_PROXY);


        // Test Operators in EL Goerli Anvil
        operatorsListPrivateKey[0] = 0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97;
        operatorsListPrivateKey[1] = 0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6;

        // Test dummy Watchtowers
        watchtowersListPrivateKey[0] = uint256(keccak256(abi.encodePacked(bytesToUint("0"))));
        watchtowersListPrivateKey[1] = uint256(keccak256(abi.encodePacked(bytesToUint("1"))));

        // Get a list of operator and watchtower addresses
        for (uint i = 0; i < 2; i++) {
            operatorsList[i] = vm.addr(operatorsListPrivateKey[i]);
            watchtowersList[i] = vm.addr(watchtowersListPrivateKey[i]);
        }

        // Whitelisting of operators is only possible by Witness Chain Admin
        vm.startBroadcast(deployerPrivateKey);
        operatorRegistry.addToOperatorWhitelist(operatorsList);
        vm.stopBroadcast();

        // Simulate registering of individual watchtowers
        for (uint i = 0; i < 2; i++) {
            vm.startPrank(operatorsList[i]);
            uint256 expiry = block.number+100000000000;
            (,, bytes memory signedMessage) 
                = signMessage(watchtowersListPrivateKey[i],operatorsList[i],expiry);
            operatorRegistry.registerWatchtowerAsOperator(watchtowersList[i], expiry, signedMessage);
            vm.stopPrank();
        }
    }

    /// @notice Following are tests for write functions
    // Fail check
    function testSetPODBountyInvalidChainID() public {
        uint256 invalidChainID = 12345;
        uint256 validBountyAmount = 100;
        vm.startPrank(vm.addr(deployerPrivateKey));
        vm.expectRevert(bytes("WitnessHub: Invalid Chain ID"));
        diligence.setPODClaimBounties(invalidChainID, validBountyAmount);
        vm.stopPrank();
    }

    // Fail check
    function testSetPODBountyInvalidClaimBounties() public {
        uint256 validChainID = 420;
        uint256 invalidClaimBounties = 0;
        vm.startPrank(vm.addr(deployerPrivateKey));
        vm.expectRevert(bytes("WitnessHub: _claimBounties should be > 0"));
        diligence.setPODClaimBounties(validChainID, invalidClaimBounties);
        vm.stopPrank();
    }

    // Pass check
    function testSetPODBountyPass() public {
        uint256 validChainID = 420;
        uint256 validClaimBounties = 100;
        vm.startPrank(vm.addr(deployerPrivateKey));
        diligence.setPODClaimBounties(validChainID, validClaimBounties);
        vm.stopPrank();
        assertEq(diligence.getPODClaimBounties(validChainID), validClaimBounties);
    }

    // Fail check
    function testSetPOIBountyInvalidChainID() public {
        uint256 invalidChainID = 12345;
        uint256 validClaimBounties = 100;
        vm.startPrank(vm.addr(deployerPrivateKey));
        vm.expectRevert(bytes("WitnessHub: Invalid Chain ID"));
        diligence.setPOIClaimBounties(invalidChainID, validClaimBounties);
        vm.stopPrank();
    }

    // Fail check
    function testSetPOIBountyInvalidClaimBounties() public {
        uint256 validChainID = 420;
        uint256 invalidClaimBounties = 0;
        vm.startPrank(vm.addr(deployerPrivateKey));
        vm.expectRevert(bytes("WitnessHub: _claimBounties should be > 0"));
        diligence.setPOIClaimBounties(validChainID, invalidClaimBounties);
        vm.stopPrank();
    }

    // Pass check
    function testSetPOIBountyPass() public {
        uint256 validChainID = 420;
        uint256 validClaimBounties = 100;
        vm.startPrank(vm.addr(deployerPrivateKey));
        diligence.setPOIClaimBounties(validChainID, validClaimBounties);
        vm.stopPrank();
        assertEq(diligence.getPOIClaimBounties(validChainID), validClaimBounties);
    }

    // Fail check
    function testGetRangeForChainIDInvalidChainID() public {
	    uint256 invalidChainID = 12345;
	    vm.startPrank(vm.addr(deployerPrivateKey));
        vm.expectRevert(bytes("WitnessHub: Invalid Chain ID"));
	    diligence.getRangeForChainID(invalidChainID);
        vm.stopPrank();
    }

    // Pass check
    function testGetRangeForChainIDDefaultRange() public {
        uint256 validChainID = 420;
        vm.startPrank(vm.addr(deployerPrivateKey));
        uint256 range = diligence.getRangeForChainID(validChainID);
        vm.stopPrank();
	    assertEq(range, 100);
    }

    // Fail check
    function testUpdateRangeForChainIDInvalidChainID() public {
        uint256 invalidChainID = 12345;
        vm.startPrank(vm.addr(deployerPrivateKey));
        vm.expectRevert(bytes("WitnessHub: Invalid Chain ID"));
	    diligence.updateRangeForChainID(invalidChainID, 101);
        vm.stopPrank();
    }

    // Pass check
    function testUpdateRangeForChainIDPass() public {
        uint256 validChainID = 420;
        vm.startPrank(vm.addr(deployerPrivateKey));
        diligence.updateRangeForChainID(validChainID, 101);
        vm.stopPrank();
	    assertEq(diligence.getRangeForChainID(validChainID), 101);
    }

    // Fail check
    function testSubmitPODProofWatchtowerOperatorInactive() public {
        uint256 validChainID = 420;
        uint256 validClaimBounties = 100;
	    uint256 latestL2BlockNumber = 1000;
        vm.startPrank(vm.addr(deployerPrivateKey));
        diligence.setPODClaimBounties(validChainID, validClaimBounties);
        operatorRegistry.suspend(operatorsList[0]);
        vm.stopPrank();

        (bytes memory message, , bytes memory signature) = signMessage(watchtowersListPrivateKey[0], "Testimonial");

        vm.startPrank(watchtowersList[0]);
        vm.expectRevert(bytes("WitnessHub: Invalid Watchtower"));
        diligence.submitPODProof(validChainID, latestL2BlockNumber, message, signature);
        vm.stopPrank();
    }

    // Fail check
    function testSubmitPODProofDeregistered() public {
        uint256 validChainID = 420;
        uint256 validClaimBounties = 100;
	    uint256 latestL2BlockNumber = 1000;
        vm.startPrank(vm.addr(deployerPrivateKey));
        diligence.setPODClaimBounties(validChainID, validClaimBounties);
        vm.stopPrank();
        vm.startPrank(operatorsList[0]);
        operatorRegistry.deRegister(watchtowersList[0]);
        vm.stopPrank();

        (bytes memory message, , bytes memory signature) = signMessage(watchtowersListPrivateKey[0], "Testimonial");

        vm.startPrank(operatorsList[0]);
        vm.expectRevert(bytes("WitnessHub: Invalid Watchtower"));
        diligence.submitPODProof(validChainID, latestL2BlockNumber, message, signature);
        vm.stopPrank();
    }

    // Fail check
    function testSubmitPODProofSignerNotTxnOriginator() public {
        uint256 validChainID = 420;
        uint256 validClaimBounties = 100;
	    uint256 latestL2BlockNumber = 1000;
        vm.startPrank(vm.addr(deployerPrivateKey));
        diligence.setPODClaimBounties(validChainID, validClaimBounties);
        vm.stopPrank();

        (bytes memory message, , bytes memory signature) = signMessage(watchtowersListPrivateKey[0], "Testimonial");

        vm.startPrank(watchtowersList[1]);
        vm.expectRevert(bytes("WitnessHub: Signer is not the txn originator"));
        diligence.submitPODProof(validChainID, latestL2BlockNumber, message, signature);
        vm.stopPrank();
    }

    // Fail check
    function testSubmitPODProofMinerAlreadySubmittedClaim() public {
        uint256 validChainID = 420;
        uint256 validClaimBounties = 100;
	    uint256 latestL2BlockNumber = 1000;
        vm.startPrank(vm.addr(deployerPrivateKey));
        diligence.setPODClaimBounties(validChainID, validClaimBounties);
        vm.stopPrank();

        (bytes memory message, , bytes memory signature) = signMessage(watchtowersListPrivateKey[0], "Testimonial");

        vm.startPrank(watchtowersList[0]);
        diligence.submitPODProof(validChainID, latestL2BlockNumber, message, signature);
        vm.expectRevert(bytes("WitnessHub: Miner has already submitted claim"));
        diligence.submitPODProof(validChainID, latestL2BlockNumber, message, signature);
        vm.stopPrank();
    }

    // Pass check
    function testSubmitPODPoIProofSameBlock() public {
        uint256 validChainID = 420;
        uint256 validClaimBounties = 100;
	    uint256 latestL2BlockNumber = 1000;
        vm.startPrank(vm.addr(deployerPrivateKey));
        diligence.setPODClaimBounties(validChainID, validClaimBounties);
        diligence.setPOIClaimBounties(validChainID, validClaimBounties);
        vm.stopPrank();

        (bytes memory message, , bytes memory signature) = signMessage(watchtowersListPrivateKey[0], "Testimonial");

        vm.startPrank(watchtowersList[0]);
        diligence.submitPODProof(validChainID, latestL2BlockNumber, message, signature);
        diligence.submitPOIProof(validChainID, latestL2BlockNumber, message, signature);
        vm.stopPrank();
    }

    // Pass check
    function testSubmitPODProofPass() public {
        uint256 validChainID = 420;
        uint256 validClaimBounties = 101;
	    uint256 latestL2BlockNumber = 1000;
        vm.startPrank(vm.addr(deployerPrivateKey));
        diligence.setPODClaimBounties(validChainID, validClaimBounties);
        vm.stopPrank();

        (bytes memory message, , bytes memory signature) = signMessage(watchtowersListPrivateKey[0], "Testimonial");
	    vm.startPrank(watchtowersList[0]);
        diligence.submitPODProof(validChainID, latestL2BlockNumber, message, signature);
        vm.stopPrank();
    }

    // Fail check
    function testSubmitPOIProofWatchtowerOperatorInactive() public {
        uint256 validChainID = 420;
        uint256 validClaimBounties = 100;
	    uint256 latestL2BlockNumber = 1000;
        vm.startPrank(vm.addr(deployerPrivateKey));
        diligence.setPOIClaimBounties(validChainID, validClaimBounties);
        operatorRegistry.suspend(operatorsList[0]);
        vm.stopPrank();

        (bytes memory message, , bytes memory signature) = signMessage(watchtowersListPrivateKey[0], "Testimonial");

        vm.startPrank(watchtowersList[0]);
        vm.expectRevert(bytes("WitnessHub: Invalid Watchtower"));
        diligence.submitPOIProof(validChainID, latestL2BlockNumber, message, signature);
        vm.stopPrank();
    }

    // Fail check
    function testSubmitPOIProofSignerNotTxnOriginator() public {
        uint256 validChainID = 420;
        uint256 validClaimBounties = 100;
	    uint256 latestL2BlockNumber = 1000;
        vm.startPrank(vm.addr(deployerPrivateKey));
        diligence.setPOIClaimBounties(validChainID, validClaimBounties);
        vm.stopPrank();

        (bytes memory message, , bytes memory signature) = signMessage(watchtowersListPrivateKey[0], "Testimonial");

        vm.startPrank(watchtowersList[1]);
        vm.expectRevert(bytes("WitnessHub: Signer is not the txn originator"));
        diligence.submitPOIProof(validChainID, latestL2BlockNumber, message, signature);
        vm.stopPrank();
    }

    // Fail check
    function testSubmitPOIProofMinerAlreadySubmittedClaim() public {
        uint256 validChainID = 420;
        uint256 validClaimBounties = 100;
	    uint256 latestL2BlockNumber = 1000;
        vm.startPrank(vm.addr(deployerPrivateKey));
        diligence.setPOIClaimBounties(validChainID, validClaimBounties);
        vm.stopPrank();

        (bytes memory message, , bytes memory signature) = signMessage(watchtowersListPrivateKey[0], "Testimonial");

        vm.startPrank(watchtowersList[0]);
        diligence.submitPOIProof(validChainID, latestL2BlockNumber, message, signature);
        vm.expectRevert(bytes("WitnessHub: Miner has already submitted claim"));
        diligence.submitPOIProof(validChainID, latestL2BlockNumber, message, signature);
        vm.stopPrank();
    }

    // Pass check
    function testSubmitPOIProofPass() public {
        uint256 validChainID = 420;
        uint256 validClaimBounties = 101;
	    uint256 latestL2BlockNumber = 1000;
        vm.startPrank(vm.addr(deployerPrivateKey));
        diligence.setPOIClaimBounties(validChainID, validClaimBounties);
        vm.stopPrank();

        (bytes memory message, , bytes memory signature) = signMessage(watchtowersListPrivateKey[0], "Testimonial");
	    vm.startPrank(watchtowersList[0]);
        diligence.submitPOIProof(validChainID, latestL2BlockNumber, message, signature);
        vm.stopPrank();
    }

    function signMessage (uint256 signerPrivateKey, string memory _message) pure internal returns (bytes memory, bytes32, bytes memory )  {
      bytes memory message = bytes(_message);
      bytes32 messageHash = keccak256(abi.encodePacked(message));
      bytes32 eth_signed_message = messageHash.toEthSignedMessageHash();
      (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerPrivateKey, eth_signed_message);
      bytes memory signature = abi.encodePacked(r, s, v);
      return (message, messageHash,signature);
    }

    function testDiligence_ValidateELRegisteredOperators() public {
      for(uint i=0; i<2; i++) {
          assertEq(operatorRegistry.isActiveOperator(operatorsList[i]),true,"WitnessHub: Not Registered operator");
        }
    }

    function testFailDiligence_ValidateELRegisteredOperators() public {
       uint256 seed = 1;
       address randomAddress = address(uint160(uint256(keccak256(abi.encodePacked(seed)))));
       assertEq(operatorRegistry.isActiveOperator(randomAddress),true,"WitnessHub: This is a fail scenario");
    }
}