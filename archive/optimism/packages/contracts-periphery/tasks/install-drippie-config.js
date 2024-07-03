"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("hardhat/config");
const hardware_wallets_1 = require("@ethersproject/hardware-wallets");
require("@nomiclabs/hardhat-ethers");
require("hardhat-deploy");
const src_1 = require("../src");
(0, config_1.task)('install-drippie-config').setAction(async (args, hre) => {
    console.log(`connecting to ledger...`);
    const signer = new hardware_wallets_1.LedgerSigner(hre.ethers.provider, 'default', hre.ethers.utils.defaultPath);
    console.log(`connecting to Drippie...`);
    const Drippie = await hre.ethers.getContractAt('Drippie', (await hre.deployments.get('Drippie')).address, signer);
    console.log(`loading local version of Drippie config for network...`);
    const config = await (0, src_1.getDrippieConfig)(hre);
    // Need this to deal with annoying Ethers/Ledger 1559 issue.
    const sendtx = async (tx) => {
        const gas = await signer.estimateGas(tx);
        tx.type = 1;
        tx.gasLimit = gas;
        const ret = await signer.sendTransaction(tx);
        console.log(`sent tx: ${ret.hash}`);
        console.log(`waiting for tx to be confirmed...`);
        await ret.wait();
        console.log(`tx confirmed`);
    };
    console.log(`installing Drippie config file...`);
    for (const [dripName, dripConfig] of Object.entries(config)) {
        console.log(`checking config for drip: ${dripName}`);
        const drip = await Drippie.drips(dripName);
        if (drip.status === 0) {
            console.log(`drip does not exist yet: ${dripName}`);
            console.log(`creating drip...`);
            const tx = await Drippie.populateTransaction.create(dripName, dripConfig);
            await sendtx(tx);
        }
        else if (!(0, src_1.isSameConfig)(dripConfig, drip.config)) {
            console.log(`drip exists but local config is different: ${dripName}`);
            console.log(`drips cannot be modified for security reasons`);
            console.log(`please do not modify the local config for existing drips`);
            console.log(`you can archive the old drip and create another`);
        }
        else {
            console.log(`drip is already installed`);
        }
    }
    console.log(`config is fully installed`);
});
