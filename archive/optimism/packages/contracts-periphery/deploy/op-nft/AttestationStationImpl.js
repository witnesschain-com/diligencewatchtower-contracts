"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@nomiclabs/hardhat-ethers");
require("@eth-optimism/hardhat-deploy-config");
require("hardhat-deploy");
const deployFn = async (hre) => {
    const { deployer } = await hre.getNamedAccounts();
    console.log(`Deploying AttestationStation with ${deployer}`);
    const { deploy } = await hre.deployments.deterministic('AttestationStation', {
        salt: hre.ethers.utils.solidityKeccak256(['string'], ['AttestationStation']),
        from: deployer,
        args: [],
        log: true,
    });
    await deploy();
    const Deployment__AttestationStation = await hre.deployments.get('AttestationStation');
    const addr = Deployment__AttestationStation.address;
    console.log(`AttestationStation deployed to ${addr}`);
};
deployFn.tags = ['AttestationStation', 'OptimistEnvironment'];
exports.default = deployFn;
