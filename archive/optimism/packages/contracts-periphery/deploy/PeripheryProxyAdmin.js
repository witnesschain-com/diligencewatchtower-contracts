"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const deployFn = async (hre) => {
    const { deployer } = await hre.getNamedAccounts();
    const { deploy } = await hre.deployments.deterministic('PeripheryProxyAdmin', {
        contract: 'ProxyAdmin',
        salt: hre.ethers.utils.solidityKeccak256(['string'], ['PeripheryProxyAdmin']),
        from: deployer,
        args: [hre.deployConfig.ddd],
        log: true,
    });
    await deploy();
};
deployFn.tags = ['PeripheryProxyAdmin'];
exports.default = deployFn;
