"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@nomiclabs/hardhat-ethers");
require("@eth-optimism/hardhat-deploy-config");
require("hardhat-deploy");
const deployFn = async (hre) => {
    const deployConfig = hre.deployConfig;
    const { deployer } = await hre.getNamedAccounts();
    console.log(`Deploying Optimist implementation with ${deployer}`);
    const Deployment__AttestationStationProxy = await hre.deployments.get('AttestationStationProxy');
    const attestationStationAddress = Deployment__AttestationStationProxy.address;
    console.log(`Using ${attestationStationAddress} as the ATTESTATION_STATION`);
    console.log(`Using ${deployConfig.optimistBaseUriAttestorAddress} as BASE_URI_ATTESTOR`);
    const Deployment__OptimistAllowlistProxy = await hre.deployments.get('OptimistAllowlistProxy');
    const optimistAllowlistAddress = Deployment__OptimistAllowlistProxy.address;
    const { deploy } = await hre.deployments.deterministic('Optimist', {
        salt: hre.ethers.utils.solidityKeccak256(['string'], ['Optimist']),
        from: deployer,
        args: [
            deployConfig.optimistName,
            deployConfig.optimistSymbol,
            deployConfig.optimistBaseUriAttestorAddress,
            attestationStationAddress,
            optimistAllowlistAddress,
        ],
        log: true,
    });
    await deploy();
};
deployFn.tags = ['OptimistImpl', 'OptimistEnvironment'];
deployFn.dependencies = ['AttestationStationProxy', 'OptimistAllowlistProxy'];
exports.default = deployFn;
