// npx hardhat run script/deployment/testnet/l2/deploy-proxy-AlertManager.js --network blue-orangutan                  
const { ethers, upgrades } = require("hardhat");
var CONTRACT_ADDR_CONFIG = require('../output/1237146866/deployment_output.json');

async function main() {
  const AMInstance = await ethers.getContractFactory("AlertManager");
  const l2ChainMappingAddress = CONTRACT_ADDR_CONFIG.addresses.l2ChainMapping;
  const operatorRegistryProxy = CONTRACT_ADDR_CONFIG.addresses.OperatorRegistryProxy;
  const AMProxy = await upgrades.deployProxy(AMInstance,[operatorRegistryProxy, l2ChainMappingAddress]);
  await AMProxy.waitForDeployment();
  const AMProxyAddr =  await AMProxy.getAddress();
  console.log("AM Proxy deployed to:", AMProxyAddr);
  console.log("AM Impl deployed to:",await upgrades.erc1967.getImplementationAddress(AMProxyAddr));
 }

main();