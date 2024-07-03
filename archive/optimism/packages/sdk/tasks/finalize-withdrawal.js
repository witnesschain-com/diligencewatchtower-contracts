"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("hardhat/config");
const ethers_1 = require("ethers");
const core_utils_1 = require("@eth-optimism/core-utils");
require("hardhat-deploy");
require("@nomiclabs/hardhat-ethers");
const src_1 = require("../src");
(0, config_1.task)('finalize-withdrawal', 'Finalize a withdrawal')
    .addParam('transactionHash', 'L2 Transaction hash to finalize', '', config_1.types.string)
    .addParam('l2Url', 'L2 HTTP URL', 'http://localhost:9545', config_1.types.string)
    .setAction(async (args, hre) => {
    const txHash = args.transactionHash;
    if (txHash === '') {
        console.log('No tx hash');
    }
    const signers = await hre.ethers.getSigners();
    if (signers.length === 0) {
        throw new Error('No configured signers');
    }
    const signer = signers[0];
    const address = await signer.getAddress();
    console.log(`Using signer: ${address}`);
    const l2Provider = new ethers_1.providers.StaticJsonRpcProvider(args.l2Url);
    const l2Signer = new ethers_1.Wallet(hre.network.config.accounts[0], l2Provider);
    let Deployment__L1StandardBridgeProxy = await hre.deployments.getOrNull('L1StandardBridgeProxy');
    if (Deployment__L1StandardBridgeProxy === undefined) {
        Deployment__L1StandardBridgeProxy = await hre.deployments.getOrNull('Proxy__OVM_L1StandardBridge');
    }
    let Deployment__L1CrossDomainMessengerProxy = await hre.deployments.getOrNull('L1CrossDomainMessengerProxy');
    if (Deployment__L1CrossDomainMessengerProxy === undefined) {
        Deployment__L1CrossDomainMessengerProxy = await hre.deployments.getOrNull('Proxy__OVM_L1CrossDomainMessenger');
    }
    const Deployment__L2OutputOracleProxy = await hre.deployments.getOrNull('L2OutputOracleProxy');
    const Deployment__OptimismPortalProxy = await hre.deployments.getOrNull('OptimismPortalProxy');
    const messenger = new src_1.CrossChainMessenger({
        l1SignerOrProvider: signer,
        l2SignerOrProvider: l2Signer,
        l1ChainId: await signer.getChainId(),
        l2ChainId: await l2Signer.getChainId(),
        bridges: {
            Standard: {
                Adapter: src_1.StandardBridgeAdapter,
                l1Bridge: Deployment__L1StandardBridgeProxy?.address,
                l2Bridge: core_utils_1.predeploys.L2StandardBridge,
            },
        },
        contracts: {
            l1: {
                L1StandardBridge: Deployment__L1StandardBridgeProxy?.address,
                L1CrossDomainMessenger: Deployment__L1CrossDomainMessengerProxy?.address,
                L2OutputOracle: Deployment__L2OutputOracleProxy?.address,
                OptimismPortal: Deployment__OptimismPortalProxy?.address,
            },
        },
    });
    console.log(`Fetching message status for ${txHash}`);
    const status = await messenger.getMessageStatus(txHash);
    console.log(`Status: ${src_1.MessageStatus[status]}`);
    if (status === src_1.MessageStatus.READY_TO_PROVE) {
        const proveTx = await messenger.proveMessage(txHash);
        const proveReceipt = await proveTx.wait();
        console.log('Prove receipt', proveReceipt);
        const finalizeInterval = setInterval(async () => {
            const currentStatus = await messenger.getMessageStatus(txHash);
            console.log(`Message status: ${src_1.MessageStatus[currentStatus]}`);
        }, 3000);
        try {
            await messenger.waitForMessageStatus(txHash, src_1.MessageStatus.READY_FOR_RELAY);
        }
        finally {
            clearInterval(finalizeInterval);
        }
        const tx = await messenger.finalizeMessage(txHash);
        const receipt = await tx.wait();
        console.log(receipt);
        console.log('Finalized withdrawal');
    }
});
