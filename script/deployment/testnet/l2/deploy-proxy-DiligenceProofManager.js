// npx hardhat run deploy-proxy-DiligenceProofManager.js --network witnesschain-testnet                     
const { ethers, upgrades } = require("hardhat");

async function main() {
  const DPMInstance = await ethers.getContractFactory("DiligenceProofManager");
  const l2ChainMappingAddress = "0xd78001BB9B70E8bFF27800fc1d877b4D29459C13";
  const operatorRegistryProxy = "0xC095dD8f3bDfdcD8E061f5cfB46f062D0a3aCbb6";
  const dpmProxy = await upgrades.deployProxy(DPMInstance,[operatorRegistryProxy, l2ChainMappingAddress]);
  await dpmProxy.waitForDeployment();
  console.log("DiligenceProofManager deployed to:", await dpmProxy.getAddress());
}

main();