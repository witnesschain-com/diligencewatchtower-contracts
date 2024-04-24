// npx hardhat run script/deployment/testnet/l2/deploy-proxy-OperatorRegistry.js --network witnesschain-testnet       
const { ethers, upgrades } = require("hardhat");

async function main() {
  const operatorRegistryImplementation = await ethers.getContractFactory("OperatorRegistry");
  const delegationManagerAddress = "0xA44151489861Fe9e3055d95adC98FbD462B948e7";
  const slasherAddress = "0x055733000064333CaDDbC92763c58BF0192fFeBf";
  const operatorRegistryProxy = await upgrades.deployProxy(operatorRegistryImplementation,[delegationManagerAddress, slasherAddress]);
  await operatorRegistryProxy.waitForDeployment();
  console.log("OperatorRegistry Instance deployed to:", operatorRegistryImplementation.address);
  console.log("OperatorRegistry Proxy deployed to:", await operatorRegistryProxy.getAddress());
}

main();