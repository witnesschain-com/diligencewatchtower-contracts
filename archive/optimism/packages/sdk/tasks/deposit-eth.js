"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const config_1 = require("hardhat/config");
require("@nomiclabs/hardhat-ethers");
require("hardhat-deploy");
const core_utils_1 = require("@eth-optimism/core-utils");
const ethers_1 = require("ethers");
const L2ToL1MessagePasser_json_1 = __importDefault(require("@eth-optimism/contracts-bedrock/forge-artifacts/L2ToL1MessagePasser.sol/L2ToL1MessagePasser.json"));
const L2CrossDomainMessenger_json_1 = __importDefault(require("@eth-optimism/contracts-bedrock/forge-artifacts/L2CrossDomainMessenger.sol/L2CrossDomainMessenger.json"));
const L2StandardBridge_json_1 = __importDefault(require("@eth-optimism/contracts-bedrock/forge-artifacts/L2StandardBridge.sol/L2StandardBridge.json"));
const OptimismPortal_json_1 = __importDefault(require("@eth-optimism/contracts-bedrock/forge-artifacts/OptimismPortal.sol/OptimismPortal.json"));
const L1CrossDomainMessenger_json_1 = __importDefault(require("@eth-optimism/contracts-bedrock/forge-artifacts/L1CrossDomainMessenger.sol/L1CrossDomainMessenger.json"));
const L1StandardBridge_json_1 = __importDefault(require("@eth-optimism/contracts-bedrock/forge-artifacts/L1StandardBridge.sol/L1StandardBridge.json"));
const src_1 = require("../src");
const { formatEther } = ethers_1.utils;
(0, config_1.task)('deposit-eth', 'Deposits ether to L2.')
    .addParam('l2ProviderUrl', 'L2 provider URL.', 'http://localhost:9545', config_1.types.string)
    .addOptionalParam('to', 'Recipient of the ether', '', config_1.types.string)
    .addOptionalParam('amount', 'Amount of ether to send (in ETH)', '', config_1.types.string)
    .addOptionalParam('withdraw', 'Follow up with a withdrawal', true, config_1.types.boolean)
    .addOptionalParam('l1ContractsJsonPath', 'Path to a JSON with L1 contract addresses in it', '', config_1.types.string)
    .addOptionalParam('withdrawAmount', 'Amount to withdraw', '', config_1.types.string)
    .setAction(async (args, hre) => {
    const signers = await hre.ethers.getSigners();
    if (signers.length === 0) {
        throw new Error('No configured signers');
    }
    // Use the first configured signer for simplicity
    const signer = signers[0];
    const address = await signer.getAddress();
    console.log(`Using signer ${address}`);
    // Ensure that the signer has a balance before trying to
    // do anything
    const balance = await signer.getBalance();
    if (balance.eq(0)) {
        throw new Error('Signer has no balance');
    }
    console.log(`Signer balance: ${formatEther(balance.toString())}`);
    const l2Provider = new ethers_1.providers.StaticJsonRpcProvider(args.l2ProviderUrl);
    // send to self if not specified
    const to = args.to ? args.to : address;
    const amount = args.amount
        ? ethers_1.utils.parseEther(args.amount)
        : ethers_1.utils.parseEther('1');
    const withdrawAmount = args.withdrawAmount
        ? ethers_1.utils.parseEther(args.withdrawAmount)
        : amount.div(2);
    const l2Signer = new hre.ethers.Wallet(hre.network.config.accounts[0], l2Provider);
    const l2ChainId = await l2Signer.getChainId();
    let contractAddrs = src_1.CONTRACT_ADDRESSES[l2ChainId];
    if (args.l1ContractsJsonPath) {
        const data = await fs_1.promises.readFile(args.l1ContractsJsonPath);
        contractAddrs = {
            l1: JSON.parse(data.toString()),
            l2: src_1.DEFAULT_L2_CONTRACT_ADDRESSES,
        };
    }
    else if (!contractAddrs) {
        // If the contract addresses have not been hardcoded,
        // attempt to read them from deployment artifacts
        let Deployment__AddressManager;
        try {
            Deployment__AddressManager = await hre.deployments.get('AddressManager');
        }
        catch (e) {
            Deployment__AddressManager = await hre.deployments.get('Lib_AddressManager');
        }
        let Deployment__L1CrossDomainMessenger;
        try {
            Deployment__L1CrossDomainMessenger = await hre.deployments.get('L1CrossDomainMessengerProxy');
        }
        catch (e) {
            Deployment__L1CrossDomainMessenger = await hre.deployments.get('Proxy__OVM_L1CrossDomainMessenger');
        }
        let Deployment__L1StandardBridge;
        try {
            Deployment__L1StandardBridge = await hre.deployments.get('L1StandardBridgeProxy');
        }
        catch (e) {
            Deployment__L1StandardBridge = await hre.deployments.get('Proxy__OVM_L1StandardBridge');
        }
        const Deployment__OptimismPortal = await hre.deployments.get('OptimismPortalProxy');
        const Deployment__L2OutputOracle = await hre.deployments.get('L2OutputOracleProxy');
        contractAddrs = {
            l1: {
                AddressManager: Deployment__AddressManager.address,
                L1CrossDomainMessenger: Deployment__L1CrossDomainMessenger.address,
                L1StandardBridge: Deployment__L1StandardBridge.address,
                StateCommitmentChain: ethers_1.ethers.constants.AddressZero,
                CanonicalTransactionChain: ethers_1.ethers.constants.AddressZero,
                BondManager: ethers_1.ethers.constants.AddressZero,
                OptimismPortal: Deployment__OptimismPortal.address,
                L2OutputOracle: Deployment__L2OutputOracle.address,
            },
            l2: src_1.DEFAULT_L2_CONTRACT_ADDRESSES,
        };
    }
    const OptimismPortal = new hre.ethers.Contract(contractAddrs.l1.OptimismPortal, OptimismPortal_json_1.default.abi, signer);
    const L1CrossDomainMessenger = new hre.ethers.Contract(contractAddrs.l1.L1CrossDomainMessenger, L1CrossDomainMessenger_json_1.default.abi, signer);
    const L1StandardBridge = new hre.ethers.Contract(contractAddrs.l1.L1StandardBridge, L1StandardBridge_json_1.default.abi, signer);
    const L2ToL1MessagePasser = new hre.ethers.Contract(core_utils_1.predeploys.L2ToL1MessagePasser, L2ToL1MessagePasser_json_1.default.abi);
    const L2CrossDomainMessenger = new hre.ethers.Contract(core_utils_1.predeploys.L2CrossDomainMessenger, L2CrossDomainMessenger_json_1.default.abi);
    const L2StandardBridge = new hre.ethers.Contract(core_utils_1.predeploys.L2StandardBridge, L2StandardBridge_json_1.default.abi);
    const messenger = new src_1.CrossChainMessenger({
        l1SignerOrProvider: signer,
        l2SignerOrProvider: l2Signer,
        l1ChainId: await signer.getChainId(),
        l2ChainId,
        bedrock: true,
        contracts: contractAddrs,
    });
    const opBalanceBefore = await signer.provider.getBalance(OptimismPortal.address);
    const l1BridgeBalanceBefore = await signer.provider.getBalance(L1StandardBridge.address);
    // Deposit ETH
    console.log('Depositing ETH through StandardBridge');
    console.log(`Sending ${formatEther(amount)} ether`);
    const ethDeposit = await messenger.depositETH(amount, { recipient: to });
    console.log(`Transaction hash: ${ethDeposit.hash}`);
    const depositMessageReceipt = await messenger.waitForMessageReceipt(ethDeposit);
    if (depositMessageReceipt.receiptStatus !== 1) {
        throw new Error('deposit failed');
    }
    console.log(`Deposit complete - included in block ${depositMessageReceipt.transactionReceipt.blockNumber}`);
    const opBalanceAfter = await signer.provider.getBalance(OptimismPortal.address);
    const l1BridgeBalanceAfter = await signer.provider.getBalance(L1StandardBridge.address);
    console.log(`L1StandardBridge balance before: ${formatEther(l1BridgeBalanceBefore)}`);
    console.log(`L1StandardBridge balance after: ${formatEther(l1BridgeBalanceAfter)}`);
    console.log(`OptimismPortal balance before: ${formatEther(opBalanceBefore)}`);
    console.log(`OptimismPortal balance after: ${formatEther(opBalanceAfter)}`);
    if (!opBalanceBefore.add(amount).eq(opBalanceAfter)) {
        throw new Error(`OptimismPortal balance mismatch`);
    }
    const l2Balance = await l2Provider.getBalance(to);
    console.log(`L2 balance of deposit recipient: ${ethers_1.utils.formatEther(l2Balance.toString())}`);
    if (!args.withdraw) {
        return;
    }
    console.log('Withdrawing ETH');
    const ethWithdraw = await messenger.withdrawETH(withdrawAmount);
    console.log(`Transaction hash: ${ethWithdraw.hash}`);
    const ethWithdrawReceipt = await ethWithdraw.wait();
    console.log(`ETH withdrawn on L2 - included in block ${ethWithdrawReceipt.blockNumber}`);
    {
        // check the logs
        for (const log of ethWithdrawReceipt.logs) {
            switch (log.address) {
                case L2ToL1MessagePasser.address: {
                    const parsed = L2ToL1MessagePasser.interface.parseLog(log);
                    console.log(parsed.name);
                    console.log(parsed.args);
                    console.log();
                    break;
                }
                case L2StandardBridge.address: {
                    const parsed = L2StandardBridge.interface.parseLog(log);
                    console.log(parsed.name);
                    console.log(parsed.args);
                    console.log();
                    break;
                }
                case L2CrossDomainMessenger.address: {
                    const parsed = L2CrossDomainMessenger.interface.parseLog(log);
                    console.log(parsed.name);
                    console.log(parsed.args);
                    console.log();
                    break;
                }
                default: {
                    console.log(`Unknown log from ${log.address} - ${log.topics[0]}`);
                }
            }
        }
    }
    console.log('Waiting to be able to prove withdrawal');
    const proveInterval = setInterval(async () => {
        const currentStatus = await messenger.getMessageStatus(ethWithdrawReceipt);
        console.log(`Message status: ${src_1.MessageStatus[currentStatus]}`);
    }, 3000);
    try {
        await messenger.waitForMessageStatus(ethWithdrawReceipt, src_1.MessageStatus.READY_TO_PROVE);
    }
    finally {
        clearInterval(proveInterval);
    }
    console.log('Proving eth withdrawal...');
    const ethProve = await messenger.proveMessage(ethWithdrawReceipt);
    console.log(`Transaction hash: ${ethProve.hash}`);
    const ethProveReceipt = await ethProve.wait();
    if (ethProveReceipt.status !== 1) {
        throw new Error('Prove withdrawal transaction reverted');
    }
    console.log('Successfully proved withdrawal');
    console.log('Waiting to be able to finalize withdrawal');
    const finalizeInterval = setInterval(async () => {
        const currentStatus = await messenger.getMessageStatus(ethWithdrawReceipt);
        console.log(`Message status: ${src_1.MessageStatus[currentStatus]}`);
    }, 3000);
    try {
        await messenger.waitForMessageStatus(ethWithdrawReceipt, src_1.MessageStatus.READY_FOR_RELAY);
    }
    finally {
        clearInterval(finalizeInterval);
    }
    console.log('Finalizing eth withdrawal...');
    const ethFinalize = await messenger.finalizeMessage(ethWithdrawReceipt);
    console.log(`Transaction hash: ${ethFinalize.hash}`);
    const ethFinalizeReceipt = await ethFinalize.wait();
    if (ethFinalizeReceipt.status !== 1) {
        throw new Error('Finalize withdrawal reverted');
    }
    console.log(`ETH withdrawal complete - included in block ${ethFinalizeReceipt.blockNumber}`);
    {
        // Check that the logs are correct
        for (const log of ethFinalizeReceipt.logs) {
            switch (log.address) {
                case L1StandardBridge.address: {
                    const parsed = L1StandardBridge.interface.parseLog(log);
                    console.log(parsed.name);
                    console.log(parsed.args);
                    console.log();
                    if (parsed.name !== 'ETHBridgeFinalized' &&
                        parsed.name !== 'ETHWithdrawalFinalized') {
                        throw new Error('Wrong event name from L1StandardBridge');
                    }
                    if (!parsed.args.amount.eq(withdrawAmount)) {
                        throw new Error('Wrong amount in event');
                    }
                    if (parsed.args.from !== address) {
                        throw new Error('Wrong to in event');
                    }
                    if (parsed.args.to !== address) {
                        throw new Error('Wrong from in event');
                    }
                    break;
                }
                case L1CrossDomainMessenger.address: {
                    const parsed = L1CrossDomainMessenger.interface.parseLog(log);
                    console.log(parsed.name);
                    console.log(parsed.args);
                    console.log();
                    if (parsed.name !== 'RelayedMessage') {
                        throw new Error('Wrong event from L1CrossDomainMessenger');
                    }
                    break;
                }
                case OptimismPortal.address: {
                    const parsed = OptimismPortal.interface.parseLog(log);
                    console.log(parsed.name);
                    console.log(parsed.args);
                    console.log();
                    // TODO: remove this if check
                    if (parsed.name === 'WithdrawalFinalized') {
                        if (parsed.args.success !== true) {
                            throw new Error('Unsuccessful withdrawal call');
                        }
                    }
                    break;
                }
                default: {
                    console.log(`Unknown log from ${log.address} - ${log.topics[0]}`);
                }
            }
        }
    }
    const opBalanceFinally = await signer.provider.getBalance(OptimismPortal.address);
    if (!opBalanceFinally.add(withdrawAmount).eq(opBalanceAfter)) {
        throw new Error('OptimismPortal balance mismatch');
    }
    console.log('Withdraw success');
});
