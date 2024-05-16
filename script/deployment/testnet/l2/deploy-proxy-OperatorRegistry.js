// npx hardhat run script/deployment/testnet/l2/deploy-proxy-OperatorRegistry.js --network blue-orangutan      
const { ethers, upgrades } = require("hardhat");
const fs = require('fs');

var CONTRACT_ADDR_CONFIG = require('./../input/1237146866/addresses_input.json');

async function main() {
  const operatorRegistryImplementation = await ethers.getContractFactory("OperatorRegistry");
  const delegationManagerAddress = CONTRACT_ADDR_CONFIG.addresses.DelegationManager;
  const slasherAddress = CONTRACT_ADDR_CONFIG.addresses.Slasher;
  const operatorRegistryProxy = await upgrades.deployProxy(operatorRegistryImplementation,[delegationManagerAddress, slasherAddress]);
  await operatorRegistryProxy.waitForDeployment();
  const operatorRegistryProxyAddr =  await operatorRegistryProxy.getAddress();
  console.log("OperatorRegistry Proxy deployed to:", operatorRegistryProxyAddr);
  console.log("OperatorRegistry Impl deployed to:",await upgrades.erc1967.getImplementationAddress(operatorRegistryProxyAddr));
  ;

}

main();