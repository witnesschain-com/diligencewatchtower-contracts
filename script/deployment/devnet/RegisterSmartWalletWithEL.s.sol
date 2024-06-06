// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "forge-std/Script.sol";
import "forge-std/console.sol";

import { OperatorRegistry } from "../../../src/core/OperatorRegistry.sol";

import { IDelegationManager } from "eigenlayer-contracts/src/contracts/interfaces/IDelegationManager.sol";
import {SampleSmartWalletOperatorRegistration} from "./../../../test/SampleSmartWalletOperatorRegistration.sol";

/** To deploy and verify DeployWatchtower contracts
 *  forge script ./script/deployment/devnet/RegisterSmartWalletWithEL.s.sol:RegisterSmartWalletWithEL --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast 
 */

contract RegisterSmartWalletWithEL is Script {

    uint256[] operatorsListPrivateKey = new uint256[](1);
    address[] smartWalletAddr = new address[](1);

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

    function run() public {

/**
 * @dev These are addresses on local anvil fork of Goerli
 *      Addresses may differ depending on local run of DeployWatchtowers.s.sol
 *      Please fix accordingly
 */
  string memory configData = readOutput("deployment_output");

  // Test Operators
  operatorsListPrivateKey[0] = vm.envUint("PRIVATE_KEY");

  // Whitelist operators and register with Witness Chain Watchtower
  OperatorRegistry operatorRegistry = OperatorRegistry(stdJson.readAddress(configData, ".addresses.OperatorRegistryProxy"));

  string memory configTestData = readTestOutput("addresses_output");
  address SAMPLE_SC_REGISTRATION_PROXY = stdJson.readAddress(configTestData, ".addresses.SampleSmartWalletRegistrationProxy");

  address delegationManagerAddr = operatorRegistry.delegationManagerAddress();

  SampleSmartWalletOperatorRegistration scWallet = SampleSmartWalletOperatorRegistration(SAMPLE_SC_REGISTRATION_PROXY);

  console.log(delegationManagerAddr);

  // Simulate registering of smart wallets
  for(uint i=0; i<operatorsListPrivateKey.length; i++){ 
          vm.startBroadcast(operatorsListPrivateKey[i]);
          scWallet.registerOperatorWithEigenlayer(delegationManagerAddr,SAMPLE_SC_REGISTRATION_PROXY);
          vm.stopBroadcast();
  }
}
}