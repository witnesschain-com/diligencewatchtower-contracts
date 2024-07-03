"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const deployFn = async (hre) => {
    const { deployer } = await hre.getNamedAccounts();
    const { deploy } = await hre.deployments.deterministic('CheckBalanceLow', {
        salt: hre.ethers.utils.solidityKeccak256(['string'], ['CheckBalanceLow']),
        from: deployer,
        log: true,
    });
    await deploy();
};
deployFn.tags = ['CheckBalanceLow', 'DrippieEnvironment'];
exports.default = deployFn;
