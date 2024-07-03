"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@nomiclabs/hardhat-ethers");
require("@eth-optimism/hardhat-deploy-config");
require("hardhat-deploy");
const deployFn = async (hre) => {
    const deployConfig = hre.deployConfig;
    const { deployer } = await hre.getNamedAccounts();
    console.log(`Deploying OptimistInviter implementation with ${deployer}`);
    const Deployment__AttestationStation = await hre.deployments.get('AttestationStationProxy');
    const attestationStationAddress = Deployment__AttestationStation.address;
    console.log(`Using ${attestationStationAddress} as the ATTESTATION_STATION`);
    console.log(`Using ${deployConfig.optimistInviterInviteGranter} as INVITE_GRANTER`);
    const { deploy } = await hre.deployments.deterministic('OptimistInviter', {
        salt: hre.ethers.utils.solidityKeccak256(['string'], ['OptimistInviter']),
        from: deployer,
        args: [
            deployConfig.optimistInviterInviteGranter,
            attestationStationAddress,
        ],
        log: true,
    });
    await deploy();
};
deployFn.tags = ['OptimistInviterImpl', 'OptimistEnvironment'];
deployFn.dependencies = ['AttestationStationProxy'];
exports.default = deployFn;
