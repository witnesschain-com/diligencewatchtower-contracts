// npx hardhat run script/deployment/testnet/l2/deploy-proxy-DiligenceProofManager.js --network blue-orangutan
const { ethers, upgrades } = require("hardhat");
var CONTRACT_ADDR_CONFIG = require('./../output/1237146866/deployment_output.json');

async function main() {
  const DPMInstance = await ethers.getContractFactory("DiligenceProofManager");
  const l2ChainMappingAddress = CONTRACT_ADDR_CONFIG.addresses.l2ChainMapping;
  const operatorRegistryProxy = CONTRACT_ADDR_CONFIG.addresses.OperatorRegistryProxy;
  const dpmProxy = await upgrades.deployProxy(DPMInstance,[operatorRegistryProxy, l2ChainMappingAddress]);
  await dpmProxy.waitForDeployment();
  const dpmProxyAddr =  await dpmProxy.getAddress();
  console.log("DPM Proxy deployed to:", dpmProxyAddr);
  console.log("DPM Impl deployed to:",await upgrades.erc1967.getImplementationAddress(dpmProxyAddr));
 }

main();