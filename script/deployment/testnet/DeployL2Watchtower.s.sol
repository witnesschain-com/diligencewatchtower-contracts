// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "forge-std/Script.sol";
import "forge-std/Test.sol";

import {OperatorRegistry} from "../../../src/core/OperatorRegistry.sol";
import {IOperatorRegistry} from "../../../src/interfaces/IOperatorRegistry.sol";
import {IWitnessHub} from "../../../src/interfaces/IWitnessHub.sol";
import {WitnessHub} from "../../../src/core/WitnessHub.sol";
import {IL2ChainMapping} from "../../../src/interfaces/IL2ChainMapping.sol";
import {L2ChainMapping} from "../../../src/core/L2ChainMapping.sol";
import {DiligenceProofManager} from "../../../src/core/DiligenceProofManager.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {IAVSDirectory} from "eigenlayer-contracts/src/contracts/interfaces/IAVSDirectory.sol";

/**
 * To deploy and verify DeployWatchtower contracts on L2
 *  ETHERSCAN_API_KEY should be blank
 *  VERIFIER_URL should be set to the blockscout verifier url
 *  forge script ./script/deployment/DeployL2Watchtower.s.sol:DeployL2Watchtower --rpc-url $RPC_URL \ 
 *        --private-key $PRIVATE_KEY --broadcast --verify --verifier-url $VERIFIER_URL \ 
 *        --etherscan-api-key $ETHERSCAN_API_KEY --legacy
 */
contract DeployL2Watchtower is Script {
    event log_named_uint(string key, uint256 val);

    function writeOutput(string memory outputJson, string memory outputFileName) internal {
        string memory outputDir = string.concat(vm.projectRoot(), "/script/deployment/output/");
        string memory chainDir = string.concat(vm.toString(block.chainid), "/");
        string memory outputFilePath = string.concat(outputDir, chainDir, outputFileName, ".json");
        vm.writeJson(outputJson, outputFilePath);
    }

    function readInput(string memory outputFileName) internal view returns (string memory) {
        string memory inputDir = string.concat(vm.projectRoot(), "/script/deployment/input/");
        string memory chainDir = string.concat(vm.toString(block.chainid), "/");
        string memory file = string.concat(outputFileName, ".json");
        return vm.readFile(string.concat(inputDir, chainDir, file));
    }

    function run() public {
        uint256 chainId = block.chainid;
        emit log_named_uint("You are deploying on ChainID", chainId);

        // Record transactions for deployment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        //address avsDirectory = vm.envAddress("AVS_DIRECTORY");
        vm.startBroadcast(deployerPrivateKey);

        string memory configData = readInput("addresses_input");

        // Addresses used during initialization
        address mainnetL2OOAddressOptimism = address(stdJson.readAddress(configData, ".addresses.MainnetL2OOOptimism"));
        address mainnetL2OOAddressBase = address(stdJson.readAddress(configData, ".addresses.MainnetL2OOBase"));
        address goerliL2OOAddressOptimism = address(stdJson.readAddress(configData, ".addresses.GoerliL2OOOptimism"));
        address goerliL2OOAddressBase = address(stdJson.readAddress(configData, ".addresses.GoerliL2OOBase"));
        address sepoliaL2OOAddressOptimism = address(stdJson.readAddress(configData, ".addresses.SepoliaL2OOOptimism"));
        address sepoliaL2OOAddressBase = address(stdJson.readAddress(configData, ".addresses.SepoliaL2OOBase"));
        address delegationManagerAddress = address(stdJson.readAddress(configData, ".addresses.DelegationManager"));
        address slasherAddress = address(stdJson.readAddress(configData, ".addresses.Slasher"));

        // Deploy the implementation contracts
        L2ChainMapping l2ChainMapping = new L2ChainMapping(
            mainnetL2OOAddressOptimism,
            mainnetL2OOAddressBase,
            goerliL2OOAddressOptimism,
            goerliL2OOAddressBase,
            sepoliaL2OOAddressOptimism,
            sepoliaL2OOAddressBase
        );
        OperatorRegistry operatorRegistry = new OperatorRegistry();
        DiligenceProofManager implementationDiligenceProofManager = new DiligenceProofManager();

        address operatorRegistryImplementation = address(operatorRegistry);
        address diligenceManagerAddress = address(implementationDiligenceProofManager);
        address l2ChainMappingAddress = address(l2ChainMapping);

        // OperatorRegistry: Deploy the proxy contracts with the implementation address and initializer
        bytes memory dataOperatorRegistryProxy = abi.encodeWithSelector(
            OperatorRegistry(operatorRegistryImplementation).initialize.selector,
            delegationManagerAddress,
            slasherAddress
        );
        ERC1967Proxy operatorRegistryProxy = new ERC1967Proxy(operatorRegistryImplementation, dataOperatorRegistryProxy);

        address operatorRegistryProxyAddress = address(operatorRegistryProxy);

        // DiligenceProofManager: Deploy the proxy contracts with the implementation address and initializer
        bytes memory dataDiligenceManagerProxy = abi.encodeWithSelector(
            DiligenceProofManager.initialize.selector,
            IOperatorRegistry(operatorRegistryProxyAddress),
            L2ChainMapping(l2ChainMappingAddress)
        );
        ERC1967Proxy diligenceManagerProxy = new ERC1967Proxy(diligenceManagerAddress, dataDiligenceManagerProxy);


        // Stop broadcasting calls from our address
        vm.stopBroadcast();

        console.log("L2ChainMapping Address:", address(l2ChainMapping));
        console.log("OperatorRegistry Address:", operatorRegistryImplementation);
        console.log("OperatorRegistry Proxy Address:", address(operatorRegistryProxy));
        console.log("DiligenceProofManager Address:", address(implementationDiligenceProofManager));
        console.log("DiligenceProofManager Proxy Address:", address(diligenceManagerProxy));

        string memory parent_object = "parent object";

        string memory deployed_addresses = "addresses";

        vm.serializeAddress(deployed_addresses, "OperatorRegistry", address(operatorRegistryImplementation));

        vm.serializeAddress(deployed_addresses, "OperatorRegistryProxy", address(operatorRegistryProxy));

        vm.serializeAddress(deployed_addresses, "DiligenceProofManager", address(implementationDiligenceProofManager));

        vm.serializeAddress(deployed_addresses, "DiligenceProofManagerProxy", address(diligenceManagerProxy));


        string memory deployed_addresses_output =
            vm.serializeAddress(deployed_addresses, "l2ChainMapping", address(l2ChainMapping));

        string memory finalJson = vm.serializeString(parent_object, deployed_addresses, deployed_addresses_output);

        writeOutput(finalJson, "deployment_output");
    }
}
