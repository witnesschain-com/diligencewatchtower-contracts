"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@eth-optimism/hardhat-deploy-config");
require("@nomiclabs/hardhat-ethers");
require("hardhat-deploy");
const deploy_utils_1 = require("@eth-optimism/contracts-bedrock/src/deploy-utils");
const ethers_1 = require("ethers");
const { getAddress } = ethers_1.utils;
/**
 * Deploys the AttestationStationProxy
 */
const deployFn = async (hre) => {
    const deployConfig = hre.deployConfig;
    const { deployer } = await hre.getNamedAccounts();
    const ddd = hre.deployConfig.ddd;
    if (getAddress(deployer) !== getAddress(ddd)) {
        throw new Error('Must deploy with the ddd');
    }
    console.log(`Deploying AttestationStationProxy with ${deployer}`);
    const Deployment__AttestationStation = await hre.deployments.get('AttestationStation');
    const { deploy } = await hre.deployments.deterministic('AttestationStationProxy', {
        salt: hre.ethers.utils.solidityKeccak256(['string'], ['AttestationStationProxy']),
        contract: 'Proxy',
        from: deployer,
        args: [deployer],
        log: true,
    });
    await deploy();
    const Deployment__AttestationStationProxy = await hre.deployments.get('AttestationStationProxy');
    const addr = Deployment__AttestationStationProxy.address;
    console.log(`AttestationStationProxy deployed to ${addr}`);
    console.log(`Using AttestationStation implementation at ${Deployment__AttestationStation.address}`);
    const Proxy = await hre.ethers.getContractAt('Proxy', addr);
    const AttestationStation = await hre.ethers.getContractAt('AttestationStation', addr);
    const implementation = await Proxy.connect(ethers_1.ethers.constants.AddressZero).callStatic.implementation();
    console.log(`implementation is set to ${implementation}`);
    if (getAddress(implementation) !==
        getAddress(Deployment__AttestationStation.address)) {
        console.log('implementation not set to AttestationStation contract');
        console.log(`Setting implementation to ${Deployment__AttestationStation.address}`);
        const tx = await Proxy.upgradeTo(Deployment__AttestationStation.address);
        const receipt = await tx.wait();
        console.log(`implementation set in tx ${receipt.transactionHash}`);
    }
    else {
        console.log('implementation already set to AttestationStation contract');
    }
    const l2ProxyOwnerAddress = deployConfig.l2ProxyOwnerAddress;
    const admin = await Proxy.connect(ethers_1.ethers.constants.AddressZero).callStatic.admin();
    console.log(`admin is set to ${admin}`);
    if (getAddress(admin) !== getAddress(l2ProxyOwnerAddress)) {
        console.log('admin not set correctly');
        console.log(`Setting admin to ${l2ProxyOwnerAddress}`);
        const tx = await Proxy.changeAdmin(l2ProxyOwnerAddress);
        const receipt = await tx.wait();
        console.log(`admin set in ${receipt.transactionHash}`);
    }
    else {
        console.log('admin already set to L2 Proxy Owner Address');
    }
    console.log('Contract deployment complete');
    await (0, deploy_utils_1.assertContractVariable)(Proxy, 'admin', l2ProxyOwnerAddress);
    await (0, deploy_utils_1.assertContractVariable)(AttestationStation, 'version', '1.1.0');
};
deployFn.tags = ['AttestationStationProxy', 'OptimistEnvironment'];
deployFn.dependencies = ['AttestationStation'];
exports.default = deployFn;
