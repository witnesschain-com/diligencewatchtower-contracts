"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const deployFn = async (hre) => {
    const { deployer } = await hre.getNamedAccounts();
    const { deploy } = await hre.deployments.deterministic('CheckBalanceHigh', {
        salt: hre.ethers.utils.solidityKeccak256(['string'], ['CheckBalanceHigh']),
        from: deployer,
        log: true,
    });
    await deploy();
};
deployFn.tags = ['CheckBalanceHigh', 'DrippieEnvironment'];
exports.default = deployFn;
