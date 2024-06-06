// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "forge-std/Script.sol";
import "forge-std/Test.sol";

import {OperatorRegistry} from "./../src/core/OperatorRegistry.sol";
import {IOperatorRegistry} from "./../src/interfaces/IOperatorRegistry.sol";

import {SampleSmartWalletOperatorRegistration} from "./SampleSmartWalletOperatorRegistration.sol";

import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * To deploy and verify DeployProverRegistry contracts
 *  forge script ./test/DeploySampleSmartWalletOperatorRegistration.s.sol:DeploySampleSmartWalletOperatorRegistration --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast;
 */
contract DeploySampleSmartWalletOperatorRegistration is Script {

    event log_named_uint(string key, uint256 val);

    function writeOutput(string memory outputJson, string memory outputFileName) internal {
        string memory chainEnv = vm.envString("CHAIN_ENV");
        string memory outputDir = string.concat(vm.projectRoot(), "/test/",chainEnv,"/output/");
        string memory chainDir = string.concat(vm.toString(block.chainid), "/");
        string memory outputFilePath = string.concat(outputDir, chainDir, outputFileName, ".json");
        vm.writeJson(outputJson, outputFilePath);
    }

    function readInput(string memory outputFileName) internal view returns (string memory) {
        string memory chainEnv = vm.envString("CHAIN_ENV");
        string memory inputDir = string.concat(vm.projectRoot(), "/script/deployment/",chainEnv,"/input/");
        string memory chainDir = string.concat(vm.toString(block.chainid), "/");
        string memory file = string.concat(outputFileName, ".json");
        return vm.readFile(string.concat(inputDir, chainDir, file));
    }

    function readOutput(string memory outputFileName) internal view returns (string memory) {
        string memory chainEnv = vm.envString("CHAIN_ENV");
        string memory inputDir = string.concat(vm.projectRoot(), "/script/deployment/",chainEnv,"/output/");
        string memory chainDir = string.concat(vm.toString(block.chainid), "/");
        string memory file = string.concat(outputFileName, ".json");
        return vm.readFile(string.concat(inputDir, chainDir, file));
    }

    function run() public {
        uint256 chainId = block.chainid;

        emit log_named_uint("You are deploying on ChainID", chainId);

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        string memory configData = readOutput("deployment_output");
    
        address proxyOperatorRegistryAddress = address(stdJson.readAddress(configData, ".addresses.OperatorRegistryProxy"));

        vm.startBroadcast(deployerPrivateKey);
       
        SampleSmartWalletOperatorRegistration sampleSmartWalletRegistration = new SampleSmartWalletOperatorRegistration();
        bytes memory dataSampleSmartWalletRegistryProxy = abi.encodeWithSelector(
            SampleSmartWalletOperatorRegistration(address(sampleSmartWalletRegistration)).initialize.selector,
            OperatorRegistry(proxyOperatorRegistryAddress)
        );
        ERC1967Proxy sampleSmartWalletRegistrationProxy = new ERC1967Proxy(address(sampleSmartWalletRegistration), dataSampleSmartWalletRegistryProxy);

        // Stop broadcasting calls from our address
        vm.stopBroadcast();

        console.log("SampleSmartWalletRegistration Address: ", address(sampleSmartWalletRegistration));
        console.log("SampleSmartWalletRegistrationProxy Address: ", address(sampleSmartWalletRegistrationProxy));

        string memory parent_object = "parent object";

        string memory deployed_addresses = "addresses";

        vm.serializeAddress(deployed_addresses, "SampleSmartWalletRegistration", address(sampleSmartWalletRegistration));

        string memory deployed_addresses_output =
        vm.serializeAddress(deployed_addresses, "SampleSmartWalletRegistrationProxy", address(sampleSmartWalletRegistrationProxy));

        string memory finalJson = vm.serializeString(parent_object, deployed_addresses, deployed_addresses_output);

        writeOutput(finalJson, "addresses_output");
    }
}