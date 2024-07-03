"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@eth-optimism/hardhat-deploy-config");
require("@nomiclabs/hardhat-ethers");
require("hardhat-deploy");
const deploy_utils_1 = require("@eth-optimism/contracts-bedrock/src/deploy-utils");
const ethers_1 = require("ethers");
const setupProxyContract_1 = require("../../src/helpers/setupProxyContract");
const { getAddress } = ethers_1.utils;
const deployFn = async (hre) => {
    const deployConfig = hre.deployConfig;
    const { deployer } = await hre.getNamedAccounts();
    const ddd = deployConfig.ddd;
    if (getAddress(deployer) !== getAddress(ddd)) {
        throw new Error('Must deploy with the ddd');
    }
    const Deployment__OptimistImpl = await hre.deployments.get('Optimist');
    console.log(`Deploying OptimistProxy with ${deployer}`);
    const { deploy } = await hre.deployments.deterministic('OptimistProxy', {
        salt: hre.ethers.utils.solidityKeccak256(['string'], ['OptimistProxy']),
        contract: 'Proxy',
        from: deployer,
        args: [deployer],
        log: true,
    });
    await deploy();
    const Deployment__OptimistProxy = await hre.deployments.get('OptimistProxy');
    console.log(`OptimistProxy deployed to ${Deployment__OptimistProxy.address}`);
    const Proxy = await hre.ethers.getContractAt('Proxy', Deployment__OptimistProxy.address);
    const Optimist = await hre.ethers.getContractAt('Optimist', Deployment__OptimistProxy.address);
    // ethers.Signer for the ddd. Should be the current owner of the Proxy.
    const dddSigner = await hre.ethers.provider.getSigner(deployer);
    // intended admin of the Proxy
    const l2ProxyOwnerAddress = deployConfig.l2ProxyOwnerAddress;
    // Create the calldata for the call to `initialize()`
    const name = deployConfig.optimistName;
    const symbol = deployConfig.optimistSymbol;
    const initializeCalldata = Optimist.interface.encodeFunctionData('initialize', [name, symbol]);
    // setup the Proxy contract with correct implementation and admin, and initialize atomically
    await (0, setupProxyContract_1.setupProxyContract)(Proxy, dddSigner, {
        targetImplAddress: Deployment__OptimistImpl.address,
        targetProxyOwnerAddress: l2ProxyOwnerAddress,
        postUpgradeCallCalldata: initializeCalldata,
    });
    const Deployment__AttestationStationProxy = await hre.deployments.get('AttestationStationProxy');
    const Deployment__OptimistAllowlistProxy = await hre.deployments.get('OptimistAllowlistProxy');
    await (0, deploy_utils_1.assertContractVariable)(Proxy, 'admin', l2ProxyOwnerAddress);
    await (0, deploy_utils_1.assertContractVariable)(Optimist, 'name', deployConfig.optimistName);
    await (0, deploy_utils_1.assertContractVariable)(Optimist, 'version', '2.0.0');
    await (0, deploy_utils_1.assertContractVariable)(Optimist, 'symbol', deployConfig.optimistSymbol);
    await (0, deploy_utils_1.assertContractVariable)(Optimist, 'BASE_URI_ATTESTOR', deployConfig.optimistBaseUriAttestorAddress);
    await (0, deploy_utils_1.assertContractVariable)(Optimist, 'OPTIMIST_ALLOWLIST', Deployment__OptimistAllowlistProxy.address);
    await (0, deploy_utils_1.assertContractVariable)(Optimist, 'ATTESTATION_STATION', Deployment__AttestationStationProxy.address);
};
deployFn.tags = ['OptimistProxy', 'OptimistEnvironment'];
deployFn.dependencies = ['AttestationStationProxy', 'OptimistImpl'];
exports.default = deployFn;
