// npx hardhat run script/deployment/testnet/l2/deploy-L2ChainMapping.js --network blue-orangutan   
// npx hardhat verify --network blue-orangutan 0xB30A899F194780a91101F7B4854640CC23AA1312 --constructor-args script/deployment/testnet/l2/deploy-L2ChainMappingArguments.js  
const { ethers, upgrades } = require("hardhat");
const fs = require('fs');

var CONTRACT_ADDR_CONFIG = require('../input/1237146866/addresses_input.json');

async function main() {
  const l2ChainMappingImplementation = await ethers.getContractFactory("L2ChainMapping");
  const opMainnet = CONTRACT_ADDR_CONFIG.addresses.MainnetL2OOOptimism;
  const baseMainnet = CONTRACT_ADDR_CONFIG.addresses.MainnetL2OOBase;
  const opGoerli = CONTRACT_ADDR_CONFIG.addresses.GoerliL2OOOptimism;
  const baseGoerli = CONTRACT_ADDR_CONFIG.addresses.GoerliL2OOBase;
  const opSepolia = CONTRACT_ADDR_CONFIG.addresses.SepoliaL2OOOptimism;
  const baseSepolia = CONTRACT_ADDR_CONFIG.addresses.SepoliaL2OOBase;

  const l2ChainMappingContract = await l2ChainMappingImplementation.deploy( 
                  opMainnet,baseMainnet,opGoerli,baseGoerli,opSepolia,baseSepolia
    );
  const l2ChainMappingAddress =  await l2ChainMappingContract.getAddress();
  console.log("L2ChainMapping deployed to:", l2ChainMappingAddress);
}

main();