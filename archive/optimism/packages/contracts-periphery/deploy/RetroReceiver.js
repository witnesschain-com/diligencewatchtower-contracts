"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const deployFn = async (hre) => {
    const { deployer } = await hre.getNamedAccounts();
    const { deploy } = await hre.deployments.deterministic('AssetReceiver', {
        salt: hre.ethers.utils.solidityKeccak256(['string'], ['RetroReceiver']),
        from: deployer,
        args: [hre.deployConfig.ddd],
        log: true,
    });
    await deploy();
};
deployFn.tags = ['RetroReceiver'];
exports.default = deployFn;
