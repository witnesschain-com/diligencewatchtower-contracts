// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "forge-std/Script.sol";
import "forge-std/console.sol";

import { OperatorRegistry } from "../../../src/core/OperatorRegistry.sol";

import { IDelegationManager } from "eigenlayer-contracts/src/contracts/interfaces/IDelegationManager.sol";

/** To deploy and verify DeployWatchtower contracts
 *  forge script ./script/deployment/devnet/RegisterOperatorsWithEL.s.sol:RegisterOperatorsWithEL --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast 
 */

contract RegisterOperatorsWithEL is Script {

    address[] operatorsList = new address[](3);
    uint256[] operatorsListPrivateKey = new uint256[](3);
    address[] watchtowersList = new address[](3);

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

    function registerOperatorWithEigenlayer(
        address delegationManager,
        uint256 ECDSAPrivateKey,
        address ECDSAAddress
    ) internal {
            console.log("Calling registerOperatorWithEigenlayer");
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

    function run() public {

/**
 * @dev These are addresses on local anvil fork of Goerli
 *      Addresses may differ depending on local run of DeployWatchtowers.s.sol
 *      Please fix accordingly
 */
  string memory configData = readOutput("deployment_output");

  // Test Operators
  operatorsListPrivateKey[0] = 0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97;
  operatorsListPrivateKey[1] = 0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6;
  operatorsListPrivateKey[2] = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;

  watchtowersList[0] = address(vm.addr(operatorsListPrivateKey[0]));
  watchtowersList[1] = address(vm.addr(operatorsListPrivateKey[1]));
  watchtowersList[2] = address(vm.addr(operatorsListPrivateKey[2]));


  // Whitelist operators and register with Witness Chain Watchtower
  OperatorRegistry operatorRegistry = OperatorRegistry(stdJson.readAddress(configData, ".addresses.OperatorRegistryProxy"));

  for(uint i=0; i<operatorsListPrivateKey.length; i++){ 
          operatorsList[i] = vm.addr(operatorsListPrivateKey[i]);
  }

  address delegationManagerAddr = operatorRegistry.delegationManagerAddress();

  console.log(delegationManagerAddr);

  // Simulate registering of individual watchtowers
  for(uint i=0; i<operatorsListPrivateKey.length; i++){ 
          vm.startBroadcast(operatorsListPrivateKey[i]);
          registerOperatorWithEigenlayer(delegationManagerAddr,operatorsListPrivateKey[i], vm.addr(operatorsListPrivateKey[i]));
          vm.stopBroadcast();
  }

}
}