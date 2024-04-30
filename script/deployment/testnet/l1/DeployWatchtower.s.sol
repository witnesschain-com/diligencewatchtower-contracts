// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "forge-std/Script.sol";
import "forge-std/Test.sol";

import {OperatorRegistry} from "../../../../src/core/OperatorRegistry.sol";
import {IOperatorRegistry} from "../../../../src/interfaces/IOperatorRegistry.sol";
import {IWitnessHub} from "../../../../src/interfaces/IWitnessHub.sol";
import {WitnessHub} from "../../../../src/core/WitnessHub.sol";
import {IL2ChainMapping} from "../../../../src/interfaces/IL2ChainMapping.sol";
import {L2ChainMapping} from "../../../../src/core/L2ChainMapping.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {IAVSDirectory} from "eigenlayer-contracts/src/contracts/interfaces/IAVSDirectory.sol";

/**
 *  To deploy and verify DeployWatchtower contracts
 *  For testnet,
 *  forge script ./script/deployment/DeployWatchtower.s.sol:DeployWatchtower --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY ;
 *  For mainnet
 *  forge script ./script/deployment/DeployWatchtower.s.sol:DeployWatchtower --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify --verifier-url https://api.etherscan.io/api\? --etherscan-api-key $ETHERSCAN_API_KEY ;
 */
contract DeployWatchtower is Script {
    event LogNamedUint(string key, uint256 val);

    function _writeOutput(string memory outputJson, string memory outputFileName) internal {
        string memory outputDir = string.concat(vm.projectRoot(), "/script/deployment/output/");
        string memory chainDir = string.concat(vm.toString(block.chainid), "/");
        string memory outputFilePath = string.concat(outputDir, chainDir, outputFileName, ".json");
        vm.writeJson(outputJson, outputFilePath);
    }

    function _readInput(string memory outputFileName) internal view returns (string memory) {
        string memory chainEnv = vm.envString("CHAIN_ENV");
        string memory inputDir = string.concat(vm.projectRoot(), "/script/deployment/",chainEnv,"/input/");
        string memory chainDir = string.concat(vm.toString(block.chainid), "/");
        string memory file = string.concat(outputFileName, ".json");
        return vm.readFile(string.concat(inputDir, chainDir, file));
    }

    function run() public {
        uint256 chainId = block.chainid;
        emit LogNamedUint("You are deploying on ChainID", chainId);

        // Record transactions for deployment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address aggregator = vm.envAddress("AGGREGATOR");
        //address avsDirectory = vm.envAddress("AVS_DIRECTORY");
        vm.startBroadcast(deployerPrivateKey);

        string memory configData = _readInput("addresses_input");

        // Addresses used during initialization
        address mainnetL2OOAddressOptimism = address(stdJson.readAddress(configData, ".addresses.MainnetL2OOOptimism"));
        address mainnetL2OOAddressBase = address(stdJson.readAddress(configData, ".addresses.MainnetL2OOBase"));
        address goerliL2OOAddressOptimism = address(stdJson.readAddress(configData, ".addresses.GoerliL2OOOptimism"));
        address goerliL2OOAddressBase = address(stdJson.readAddress(configData, ".addresses.GoerliL2OOBase"));
        address sepoliaL2OOAddressOptimism = address(stdJson.readAddress(configData, ".addresses.SepoliaL2OOOptimism"));
        address sepoliaL2OOAddressBase = address(stdJson.readAddress(configData, ".addresses.SepoliaL2OOBase"));
        address delegationManagerAddress = address(stdJson.readAddress(configData, ".addresses.DelegationManager"));
        address slasherAddress = address(stdJson.readAddress(configData, ".addresses.Slasher"));
        address avsDirectory = address(stdJson.readAddress(configData, ".addresses.AVSDirectory"));

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
        IAVSDirectory avsDirectoryContract = IAVSDirectory(avsDirectory);
        WitnessHub implementationEignTower = new WitnessHub(avsDirectoryContract);

        address operatorRegistryImplementation = address(operatorRegistry);
        address l2ChainMappingAddress = address(l2ChainMapping);
        address witnessHubAddress = address(implementationEignTower);

        // OperatorRegistry: Deploy the proxy contracts with the implementation address and initializer
        bytes memory dataOperatorRegistryProxy = abi.encodeWithSelector(
            OperatorRegistry(operatorRegistryImplementation).initialize.selector,
            delegationManagerAddress,
            slasherAddress
        );
        ERC1967Proxy operatorRegistryProxy = new ERC1967Proxy(operatorRegistryImplementation, dataOperatorRegistryProxy);

        address operatorRegistryProxyAddress = address(operatorRegistryProxy);

        // WitnessHub: Deploy the proxy contracts with the implementation address and initializer
        bytes memory dataWitnessHubProxy = abi.encodeWithSelector(
            WitnessHub.initialize.selector,
            IOperatorRegistry(operatorRegistryProxyAddress),
            IL2ChainMapping(l2ChainMappingAddress),
            aggregator
        );
        ERC1967Proxy witnessHubProxy = new ERC1967Proxy(witnessHubAddress, dataWitnessHubProxy);

        // Stop broadcasting calls from our address
        vm.stopBroadcast();

        console.log("L2ChainMapping Address:", address(l2ChainMapping));
        console.log("OperatorRegistry Address:", operatorRegistryImplementation);
        console.log("OperatorRegistry Proxy Address:", address(operatorRegistryProxy));
        console.log("WitnessHub Address:", witnessHubAddress);
        console.log("WitnessHub Proxy Address:", address(witnessHubProxy));

        string memory parentObject = "parent object";

        string memory deployedAddresses = "addresses";

        vm.serializeAddress(deployedAddresses, "OperatorRegistry", address(operatorRegistryImplementation));

        vm.serializeAddress(deployedAddresses, "OperatorRegistryProxy", address(operatorRegistryProxy));

        vm.serializeAddress(deployedAddresses, "WitnessHub", witnessHubAddress);

        vm.serializeAddress(deployedAddresses, "WitnessHubProxy", address(witnessHubProxy));

        string memory deployedAddressesOutput =
            vm.serializeAddress(deployedAddresses, "l2ChainMapping", address(l2ChainMapping));

        string memory finalJson = vm.serializeString(parentObject, deployedAddresses, deployedAddressesOutput);

        _writeOutput(finalJson, "deployment_output");
    }
}
