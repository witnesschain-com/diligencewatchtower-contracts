pragma solidity ^0.8.15;

import { Test, console, stdJson } from "forge-std/Test.sol";
import { IAlertManager, AlertManager, IOperatorRegistry } from "../src/core/AlertManager.sol";
import { L2ChainMapping } from "../src/core/L2ChainMapping.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * Setup the following variables before you run the tests
 * 
 * @dev
   export PRIVATE_KEY=<Private Key used during DeployWatchtower.sol>
   export CHAIN_ID=5 or the forked devnet chain
   export AGGREGATOR=0x630391b032F444cB40B3603b579064817f312353 or some aggregator address
   export RPC_URL=http://localhost:8545

 * forge test --rpc-url http://127.0.0.1:8545 -vvvv
 * forge test --match-contract AlertManagerTest --rpc-url http://127.0.0.1:8545 -vvvv
 */

contract AlertManagerTest is Test {
    using ECDSA for bytes32;

    AlertManager public alertManager;
    IOperatorRegistry public operatorRegistry;
    L2ChainMapping public l2ChainMapping;

    address[] operatorsList = new address[](2);
    uint256[] operatorsListPrivateKey = new uint256[](2);
    address[] watchtowersList = new address[](2);
    uint256[] watchtowersListPrivateKey = new uint256[](2);

    uint256 deployerPrivateKey;

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

    function setUp() public {
        deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        string memory configData = readOutput("deployment_output");
        
        address OPERATOR_REGISTRY_PROXY = stdJson.readAddress(configData, ".addresses.OperatorRegistryProxy");
        address L2CHAINMAPPING          = stdJson.readAddress(configData, ".addresses.l2ChainMapping");
        address ALERT_MANAGER_PROXY     = stdJson.readAddress(configData, ".addresses.AlertManagerProxy");

        operatorRegistry = IOperatorRegistry(OPERATOR_REGISTRY_PROXY);
        l2ChainMapping = L2ChainMapping(L2CHAINMAPPING);
        alertManager = AlertManager(ALERT_MANAGER_PROXY);

        // Test Operators in EL Goerli Anvil
        operatorsListPrivateKey[0] = 0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97;
        operatorsListPrivateKey[1] = 0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6;

        // Test dummy Watchtowers
        watchtowersListPrivateKey[0] = 0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356;
        watchtowersListPrivateKey[1] = 0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba;

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

    function signMessage (uint256 signerPrivateKey, string memory _message) pure internal returns (bytes memory, bytes32, bytes memory )  {
        bytes memory message = bytes(_message);
        bytes32 messageHash = keccak256(abi.encodePacked(message));
        bytes32 eth_signed_message = messageHash.toEthSignedMessageHash();
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerPrivateKey, eth_signed_message);
        bytes memory signature = abi.encodePacked(r, s, v);
        return (message, messageHash, signature);
    }

    // Fail check
    function testRaiseAlertWatchtowerOperatorInactive() public {
        uint256 chainID = 420;
        uint256 l2BlockNumber = 100000;
        bytes memory originalOutputRoot = "a";
        bytes memory computedOutputRoot = "b";
        (bytes memory message, , ) = signMessage(watchtowersListPrivateKey[0], "Testimonial");

        // make operator inactive
        vm.startPrank(vm.addr(deployerPrivateKey));
        operatorRegistry.suspend(operatorsList[0]);
        vm.stopPrank();

        vm.startPrank(watchtowersList[0]);
        vm.expectRevert(bytes("WitnessHub: Invalid Watchtower"));
        alertManager.raiseAlert(
            chainID,
            l2BlockNumber,
            originalOutputRoot,
            computedOutputRoot,
            message
        );
        vm.stopPrank();
    }

    // Pass check
    function testSubmitProofPass() public {
        uint256 chainID = 420;
        uint256 l2BlockNumber = 100000;
        bytes memory originalOutputRoot = "a";
        bytes memory computedOutputRoot = "b";
        (bytes memory message, , ) = signMessage(watchtowersListPrivateKey[0], "Testimonial");

        vm.startPrank(watchtowersList[0]);
        alertManager.raiseAlert(
            chainID,
            l2BlockNumber,
            originalOutputRoot,
            computedOutputRoot,
            message
        );
        vm.stopPrank();

        (uint256 _chainID, uint256 _l2BlockNumber, bytes memory _originalOutputRoot, bytes memory _computedOutputRoot, bytes memory _proofOfDiligence, address _sender) = alertManager.alertsByAddress(watchtowersList[0]);
        assertEq(_chainID, chainID);
        assertEq(_l2BlockNumber, l2BlockNumber);
        assertEq(_originalOutputRoot, originalOutputRoot);
        assertEq(_computedOutputRoot, computedOutputRoot);
        assertEq(_proofOfDiligence, message);
        assertEq(_sender, watchtowersList[0]);

        IAlertManager.Alert[] memory alerts = alertManager.getAlerts(chainID, l2BlockNumber);
        assertEq(alerts.length, 1);
    }

    // Pass check
    function testGetAlerts() public {
        uint256 chainID = 420;
        uint256 l2BlockNumber = 100000;
        bytes memory originalOutputRoot = "a";
        bytes memory computedOutputRoot = "b";
        (bytes memory message0,,) = signMessage(watchtowersListPrivateKey[0], "Testimonial");

        (bytes memory message1,,) = signMessage(watchtowersListPrivateKey[1], "Testimonial");

        vm.startPrank(watchtowersList[0]);
        alertManager.raiseAlert(
            chainID,
            l2BlockNumber,
            originalOutputRoot,
            computedOutputRoot,
            message0
        );
        vm.stopPrank();

        vm.startPrank(watchtowersList[1]);

        alertManager.raiseAlert(
            chainID,
            l2BlockNumber,
            originalOutputRoot,
            computedOutputRoot,
            message1
        );

        vm.stopPrank();

        IAlertManager.Alert[] memory alerts = alertManager.getAlerts(chainID, l2BlockNumber);
        assertEq(alerts.length, 2);
    }

    // Fail check
    function testFailPauseNotByOwner() public {
        vm.startPrank(address(1));
        alertManager.pause();
        vm.stopPrank();
    }

    // Fail check
    function testFailPauseWhenPaused() public {
        alertManager.pause();
        alertManager.pause();
    }
    
    // Fail check
    function testFailRaiseAlertWhenPaused() public {
        alertManager.pause();

        uint256 chainID = 420;
        uint256 l2BlockNumber = 100000;
        bytes memory originalOutputRoot = "a";
        bytes memory computedOutputRoot = "b";
        (bytes memory message,,) = signMessage(watchtowersListPrivateKey[0], "Testimonial");

        vm.startPrank(watchtowersList[0]);
        alertManager.raiseAlert(
            chainID,
            l2BlockNumber,
            originalOutputRoot,
            computedOutputRoot,
            message
        );
        vm.stopPrank();
    }

    // Fail check
    function testFailGetAlertsWhenPaused() public {
        alertManager.pause();
        uint256 chainID = 420;
        uint256 l2BlockNumber = 100000;
        alertManager.getAlerts(chainID, l2BlockNumber);
        alertManager.unpause();
    } 

    // Fail check
    function testFailUnpauseWhenNotPaused() public {
        alertManager.unpause();
    }
}