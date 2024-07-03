"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const deployFn = async (hre) => {
    const { deployer } = await hre.getNamedAccounts();
    const { deploy } = await hre.deployments.deterministic('CheckGelatoLow', {
        salt: hre.ethers.utils.solidityKeccak256(['string'], ['CheckGelatoLow']),
        from: deployer,
        log: true,
    });
    await deploy();
};
deployFn.tags = ['CheckGelatoLow', 'DrippieEnvironment'];
exports.default = deployFn;
