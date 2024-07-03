"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const config_1 = require("hardhat/config");
require("@nomiclabs/hardhat-ethers");
require("hardhat-deploy");
const ethers_1 = require("ethers");
const core_utils_1 = require("@eth-optimism/core-utils");
const WETH9_json_1 = __importDefault(require("@eth-optimism/contracts-bedrock/forge-artifacts/WETH9.sol/WETH9.json"));
const OptimismMintableERC20Factory_json_1 = __importDefault(require("@eth-optimism/contracts-bedrock/forge-artifacts/OptimismMintableERC20Factory.sol/OptimismMintableERC20Factory.json"));
const OptimismMintableERC20_json_1 = __importDefault(require("@eth-optimism/contracts-bedrock/forge-artifacts/OptimismMintableERC20.sol/OptimismMintableERC20.json"));
const L2ToL1MessagePasser_json_1 = __importDefault(require("@eth-optimism/contracts-bedrock/forge-artifacts/L2ToL1MessagePasser.sol/L2ToL1MessagePasser.json"));
const L2CrossDomainMessenger_json_1 = __importDefault(require("@eth-optimism/contracts-bedrock/forge-artifacts/L2CrossDomainMessenger.sol/L2CrossDomainMessenger.json"));
const L2StandardBridge_json_1 = __importDefault(require("@eth-optimism/contracts-bedrock/forge-artifacts/L2StandardBridge.sol/L2StandardBridge.json"));
const OptimismPortal_json_1 = __importDefault(require("@eth-optimism/contracts-bedrock/forge-artifacts/OptimismPortal.sol/OptimismPortal.json"));
const L1CrossDomainMessenger_json_1 = __importDefault(require("@eth-optimism/contracts-bedrock/forge-artifacts/L1CrossDomainMessenger.sol/L1CrossDomainMessenger.json"));
const L1StandardBridge_json_1 = __importDefault(require("@eth-optimism/contracts-bedrock/forge-artifacts/L1StandardBridge.sol/L1StandardBridge.json"));
const src_1 = require("../src");
const deployWETH9 = async (hre, wrap) => {
    const signers = await hre.ethers.getSigners();
    const signer = signers[0];
    const Factory__WETH9 = new hre.ethers.ContractFactory(WETH9_json_1.default.abi, WETH9_json_1.default.bytecode.object, signer);
    console.log('Sending deployment transaction');
    const WETH9 = await Factory__WETH9.deploy();
    const receipt = await WETH9.deployTransaction.wait();
    console.log(`WETH9 deployed: ${receipt.transactionHash}`);
    if (wrap) {
        const deposit = await signer.sendTransaction({
            value: ethers_1.utils.parseEther('1'),
            to: WETH9.address,
        });
        await deposit.wait();
    }
    return WETH9;
};
const createOptimismMintableERC20 = async (hre, L1ERC20, l2Signer) => {
    const OptimismMintableERC20TokenFactory = new ethers_1.Contract(core_utils_1.predeploys.OptimismMintableERC20Factory, OptimismMintableERC20Factory_json_1.default.abi, l2Signer);
    const name = await L1ERC20.name();
    const symbol = await L1ERC20.symbol();
    const tx = await OptimismMintableERC20TokenFactory.createOptimismMintableERC20(L1ERC20.address, `L2 ${name}`, `L2-${symbol}`);
    const receipt = await tx.wait();
    const event = receipt.events.find((e) => e.event === 'OptimismMintableERC20Created');
    if (!event) {
        throw new Error('Unable to find OptimismMintableERC20Created event');
    }
    const l2WethAddress = event.args.localToken;
    console.log(`Deployed to ${l2WethAddress}`);
    return new ethers_1.Contract(l2WethAddress, OptimismMintableERC20_json_1.default.abi, l2Signer);
};
// TODO(tynes): this task could be modularized in the future
// so that it can deposit an arbitrary token. Right now it
// deploys a WETH9 contract, mints some WETH9 and then
// deposits that into L2 through the StandardBridge.
(0, config_1.task)('deposit-erc20', 'Deposits WETH9 onto L2.')
    .addParam('l2ProviderUrl', 'L2 provider URL.', 'http://localhost:9545', config_1.types.string)
    .addParam('opNodeProviderUrl', 'op-node provider URL', 'http://localhost:7545', config_1.types.string)
    .addOptionalParam('l1ContractsJsonPath', 'Path to a JSON with L1 contract addresses in it', '', config_1.types.string)
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
    const l2Provider = new ethers_1.providers.StaticJsonRpcProvider(args.l2ProviderUrl);
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
    console.log('Deploying WETH9 to L1');
    const WETH9 = await deployWETH9(hre, true);
    console.log(`Deployed to ${WETH9.address}`);
    console.log('Creating L2 WETH9');
    const OptimismMintableERC20 = await createOptimismMintableERC20(hre, WETH9, l2Signer);
    console.log(`Approving WETH9 for deposit`);
    const approvalTx = await messenger.approveERC20(WETH9.address, OptimismMintableERC20.address, hre.ethers.constants.MaxUint256);
    await approvalTx.wait();
    console.log('WETH9 approved');
    console.log('Depositing WETH9 to L2');
    const depositTx = await messenger.depositERC20(WETH9.address, OptimismMintableERC20.address, ethers_1.utils.parseEther('1'));
    await depositTx.wait();
    console.log(`ERC20 deposited - ${depositTx.hash}`);
    // Deposit might get reorged, wait 30s and also log for reorgs.
    let prevBlockHash = '';
    for (let i = 0; i < 30; i++) {
        const messageReceipt = await messenger.waitForMessageReceipt(depositTx);
        if (messageReceipt.receiptStatus !== 1) {
            console.log(`Deposit failed, retrying...`);
        }
        if (prevBlockHash !== '' &&
            messageReceipt.transactionReceipt.blockHash !== prevBlockHash) {
            console.log(`Block hash changed from ${prevBlockHash} to ${messageReceipt.transactionReceipt.blockHash}`);
            // Wait for stability, we want at least 30 seconds after any reorg
            i = 0;
        }
        prevBlockHash = messageReceipt.transactionReceipt.blockHash;
        await (0, core_utils_1.sleep)(1000);
    }
    const l2Balance = await OptimismMintableERC20.balanceOf(address);
    if (l2Balance.lt(ethers_1.utils.parseEther('1'))) {
        throw new Error('bad deposit');
    }
    console.log(`Deposit success`);
    console.log('Starting withdrawal');
    const preBalance = await WETH9.balanceOf(signer.address);
    const withdraw = await messenger.withdrawERC20(WETH9.address, OptimismMintableERC20.address, ethers_1.utils.parseEther('1'));
    const withdrawalReceipt = await withdraw.wait();
    for (const log of withdrawalReceipt.logs) {
        switch (log.address) {
            case L2ToL1MessagePasser.address: {
                const parsed = L2ToL1MessagePasser.interface.parseLog(log);
                console.log(`Log ${parsed.name} from ${log.address}`);
                console.log(parsed.args);
                console.log();
                break;
            }
            case L2StandardBridge.address: {
                const parsed = L2StandardBridge.interface.parseLog(log);
                console.log(`Log ${parsed.name} from ${log.address}`);
                console.log(parsed.args);
                console.log();
                break;
            }
            case L2CrossDomainMessenger.address: {
                const parsed = L2CrossDomainMessenger.interface.parseLog(log);
                console.log(`Log ${parsed.name} from ${log.address}`);
                console.log(parsed.args);
                console.log();
                break;
            }
            default: {
                console.log(`Unknown log from ${log.address} - ${log.topics[0]}`);
            }
        }
    }
    setInterval(async () => {
        const currentStatus = await messenger.getMessageStatus(withdraw);
        console.log(`Message status: ${src_1.MessageStatus[currentStatus]}`);
    }, 3000);
    const now = Math.floor(Date.now() / 1000);
    console.log('Waiting for message to be able to be proved');
    await messenger.waitForMessageStatus(withdraw, src_1.MessageStatus.READY_TO_PROVE);
    console.log('Proving withdrawal...');
    const prove = await messenger.proveMessage(withdraw);
    const proveReceipt = await prove.wait();
    console.log(proveReceipt);
    if (proveReceipt.status !== 1) {
        throw new Error('Prove withdrawal transaction reverted');
    }
    console.log('Waiting for message to be able to be relayed');
    await messenger.waitForMessageStatus(withdraw, src_1.MessageStatus.READY_FOR_RELAY);
    console.log('Finalizing withdrawal...');
    // TODO: Update SDK to properly estimate gas
    const finalize = await messenger.finalizeMessage(withdraw, {
        overrides: { gasLimit: 500000 },
    });
    const finalizeReceipt = await finalize.wait();
    console.log('finalizeReceipt:', finalizeReceipt);
    console.log(`Took ${Math.floor(Date.now() / 1000) - now} seconds`);
    for (const log of finalizeReceipt.logs) {
        switch (log.address) {
            case OptimismPortal.address: {
                const parsed = OptimismPortal.interface.parseLog(log);
                console.log(`Log ${parsed.name} from OptimismPortal (${log.address})`);
                console.log(parsed.args);
                console.log();
                break;
            }
            case L1CrossDomainMessenger.address: {
                const parsed = L1CrossDomainMessenger.interface.parseLog(log);
                console.log(`Log ${parsed.name} from L1CrossDomainMessenger (${log.address})`);
                console.log(parsed.args);
                console.log();
                break;
            }
            case L1StandardBridge.address: {
                const parsed = L1StandardBridge.interface.parseLog(log);
                console.log(`Log ${parsed.name} from L1StandardBridge (${log.address})`);
                console.log(parsed.args);
                console.log();
                break;
            }
            case WETH9.address: {
                const parsed = WETH9.interface.parseLog(log);
                console.log(`Log ${parsed.name} from WETH9 (${log.address})`);
                console.log(parsed.args);
                console.log();
                break;
            }
            default:
                console.log(`Unknown log emitted from ${log.address} - ${log.topics[0]}`);
        }
    }
    const postBalance = await WETH9.balanceOf(signer.address);
    const expectedBalance = preBalance.add(ethers_1.utils.parseEther('1'));
    if (!expectedBalance.eq(postBalance)) {
        throw new Error(`Balance mismatch, expected: ${expectedBalance}, actual: ${postBalance}`);
    }
    console.log('Withdrawal success');
});
