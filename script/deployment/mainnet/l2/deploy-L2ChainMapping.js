// npx hardhat run script/deployment/mainnet/l2/deploy-L2ChainMapping.js --network l2-mainnet   
// npx hardhat verify --network l2-mainnet 0xa72088bE957BC499C0DC51eAbBc7742De2D1DEDc --constructor-args script/deployment/mainnet/l2/deploy-L2ChainMappingArguments.js  

const { ethers, upgrades } = require("hardhat");
const fs = require('fs');

var CONTRACT_ADDR_CONFIG = require('../input/1702448187/addresses_input.json');

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