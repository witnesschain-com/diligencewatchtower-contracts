// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import { OperatorRegistry } from "../../../../src/core/OperatorRegistry.sol";
import { Script, console, stdJson } from "forge-std/Script.sol";
import { L2ChainMapping } from "../../../../src/core/L2ChainMapping.sol";
import {UUPSUpgradeable} from "@openzeppelin-upgrades/contracts/proxy/utils/UUPSUpgradeable.sol";

/**
* For testnet,
* forge script ./script/deployment/testnet/l1/UpgradeOperatorRegistryImplementation.s.sol:UpgradeOperatorRegistryImplementation --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY
* For mainnet,
* forge script ./script/deployment/testnet/l1/UpgradeOperatorRegistryImplementation.s.sol:UpgradeOperatorRegistryImplementation --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify --verifier-url https://api.etherscan.io/api\? --etherscan-api-key $ETHERSCAN_API_KEY
*/

contract UpgradeOperatorRegistryImplementation is Script {
    function _readInput(string memory outputFileName)
        internal
        view
        returns (string memory)
    {
        string memory chainEnv = vm.envString("CHAIN_ENV");
        string memory inputDir = string.concat(vm.projectRoot(), "/script/deployment/",chainEnv,"/input/");
        string memory chainDir = string.concat(vm.toString(block.chainid), "/");
        string memory file = string.concat(outputFileName, ".json");
        return vm.readFile(string.concat(inputDir, chainDir, file));
    }
    
    function _readOutput(string memory outputFileName)
        internal
        view
        returns (string memory)
    {
        string memory chainEnv = vm.envString("CHAIN_ENV");
        string memory inputDir = string.concat(vm.projectRoot(), "/script/deployment/",chainEnv,"/output/");
        string memory chainDir = string.concat(vm.toString(block.chainid), "/");
        string memory file = string.concat(outputFileName, ".json");
        return vm.readFile(string.concat(inputDir, chainDir, file));
    }

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        string memory configData = _readOutput("deployment_output");
        string memory inputAddresses = _readInput("addresses_input");

        // Addresses used during initialization
        address operatorRegistryProxyAddress = address(stdJson.readAddress(configData, ".addresses.OperatorRegistryProxy"));
        address delegationManagerAddress = address(stdJson.readAddress(inputAddresses, ".addresses.DelegationManager"));
        address slasherAddress = address(stdJson.readAddress(inputAddresses, ".addresses.Slasher"));

        // Deploy new implementation contract
        OperatorRegistry operatorRegistryImplementation = new OperatorRegistry ();
    
        // Upgrade proxy contract to use new implementation contract
        UUPSUpgradeable proxy = UUPSUpgradeable(operatorRegistryProxyAddress);
        proxy.upgradeTo(address(operatorRegistryImplementation));

        // Create instance of proxy contract and set delegationManagerAddress and slasherAddress
        OperatorRegistry operatorRegistryProxy = OperatorRegistry(operatorRegistryProxyAddress);
        operatorRegistryProxy.setDelegationManagerAddress(delegationManagerAddress);
        operatorRegistryProxy.setSlasherAddress(slasherAddress);

        vm.stopBroadcast();

        // Log the proxy address
        console.log("OperatorRegistry Proxy Address:", address(proxy));
        console.log("OperatorRegistry Impl Address:",(address(operatorRegistryImplementation)));
    }
}