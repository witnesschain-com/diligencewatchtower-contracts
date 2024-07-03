"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StandardBridgeAdapter = void 0;
/* eslint-disable @typescript-eslint/no-unused-vars */
const ethers_1 = require("ethers");
const contracts_1 = require("@eth-optimism/contracts");
const core_utils_1 = require("@eth-optimism/core-utils");
const L1StandardBridge_json_1 = __importDefault(require("@eth-optimism/contracts-bedrock/forge-artifacts/L1StandardBridge.sol/L1StandardBridge.json"));
const L2StandardBridge_json_1 = __importDefault(require("@eth-optimism/contracts-bedrock/forge-artifacts/L2StandardBridge.sol/L2StandardBridge.json"));
const OptimismMintableERC20_json_1 = __importDefault(require("@eth-optimism/contracts-bedrock/forge-artifacts/OptimismMintableERC20.sol/OptimismMintableERC20.json"));
const interfaces_1 = require("../interfaces");
const utils_1 = require("../utils");
/**
 * Bridge adapter for any token bridge that uses the standard token bridge interface.
 */
class StandardBridgeAdapter {
    /**
     * Creates a StandardBridgeAdapter instance.
     *
     * @param opts Options for the adapter.
     * @param opts.messenger Provider used to make queries related to cross-chain interactions.
     * @param opts.l1Bridge L1 bridge contract.
     * @param opts.l2Bridge L2 bridge contract.
     */
    constructor(opts) {
        this.populateTransaction = {
            approve: async (l1Token, l2Token, amount, opts) => {
                if (!(await this.supportsTokenPair(l1Token, l2Token))) {
                    throw new Error(`token pair not supported by bridge`);
                }
                const token = new ethers_1.Contract((0, utils_1.toAddress)(l1Token), OptimismMintableERC20_json_1.default.abi, this.messenger.l1Provider);
                return token.populateTransaction.approve(this.l1Bridge.address, amount, opts?.overrides || {});
            },
            deposit: async (l1Token, l2Token, amount, opts) => {
                if (!(await this.supportsTokenPair(l1Token, l2Token))) {
                    throw new Error(`token pair not supported by bridge`);
                }
                if (opts?.recipient === undefined) {
                    return this.l1Bridge.populateTransaction.depositERC20((0, utils_1.toAddress)(l1Token), (0, utils_1.toAddress)(l2Token), amount, opts?.l2GasLimit || 200000, // Default to 200k gas limit.
                    '0x', // No data.
                    opts?.overrides || {});
                }
                else {
                    return this.l1Bridge.populateTransaction.depositERC20To((0, utils_1.toAddress)(l1Token), (0, utils_1.toAddress)(l2Token), (0, utils_1.toAddress)(opts.recipient), amount, opts?.l2GasLimit || 200000, // Default to 200k gas limit.
                    '0x', // No data.
                    opts?.overrides || {});
                }
            },
            withdraw: async (l1Token, l2Token, amount, opts) => {
                if (!(await this.supportsTokenPair(l1Token, l2Token))) {
                    throw new Error(`token pair not supported by bridge`);
                }
                if (opts?.recipient === undefined) {
                    return this.l2Bridge.populateTransaction.withdraw((0, utils_1.toAddress)(l2Token), amount, 0, // L1 gas not required.
                    '0x', // No data.
                    opts?.overrides || {});
                }
                else {
                    return this.l2Bridge.populateTransaction.withdrawTo((0, utils_1.toAddress)(l2Token), (0, utils_1.toAddress)(opts.recipient), amount, 0, // L1 gas not required.
                    '0x', // No data.
                    opts?.overrides || {});
                }
            },
        };
        this.estimateGas = {
            approve: async (l1Token, l2Token, amount, opts) => {
                return this.messenger.l1Provider.estimateGas(await this.populateTransaction.approve(l1Token, l2Token, amount, opts));
            },
            deposit: async (l1Token, l2Token, amount, opts) => {
                return this.messenger.l1Provider.estimateGas(await this.populateTransaction.deposit(l1Token, l2Token, amount, opts));
            },
            withdraw: async (l1Token, l2Token, amount, opts) => {
                return this.messenger.l2Provider.estimateGas(await this.populateTransaction.withdraw(l1Token, l2Token, amount, opts));
            },
        };
        this.messenger = opts.messenger;
        this.l1Bridge = new ethers_1.Contract((0, utils_1.toAddress)(opts.l1Bridge), L1StandardBridge_json_1.default.abi, this.messenger.l1Provider);
        this.l2Bridge = new ethers_1.Contract((0, utils_1.toAddress)(opts.l2Bridge), L2StandardBridge_json_1.default.abi, this.messenger.l2Provider);
    }
    async getDepositsByAddress(address, opts) {
        const events = await this.l1Bridge.queryFilter(this.l1Bridge.filters.ERC20DepositInitiated(undefined, undefined, address), opts?.fromBlock, opts?.toBlock);
        return events
            .filter((event) => {
            // Specifically filter out ETH. ETH deposits and withdrawals are handled by the ETH bridge
            // adapter. Bridges that are not the ETH bridge should not be able to handle or even
            // present ETH deposits or withdrawals.
            return (!(0, core_utils_1.hexStringEquals)(event.args.l1Token, ethers_1.ethers.constants.AddressZero) &&
                !(0, core_utils_1.hexStringEquals)(event.args.l2Token, contracts_1.predeploys.OVM_ETH));
        })
            .map((event) => {
            return {
                direction: interfaces_1.MessageDirection.L1_TO_L2,
                from: event.args.from,
                to: event.args.to,
                l1Token: event.args.l1Token,
                l2Token: event.args.l2Token,
                amount: event.args.amount,
                data: event.args.extraData,
                logIndex: event.logIndex,
                blockNumber: event.blockNumber,
                transactionHash: event.transactionHash,
            };
        })
            .sort((a, b) => {
            // Sort descending by block number
            return b.blockNumber - a.blockNumber;
        });
    }
    async getWithdrawalsByAddress(address, opts) {
        const events = await this.l2Bridge.queryFilter(this.l2Bridge.filters.WithdrawalInitiated(undefined, undefined, address), opts?.fromBlock, opts?.toBlock);
        return events
            .filter((event) => {
            // Specifically filter out ETH. ETH deposits and withdrawals are handled by the ETH bridge
            // adapter. Bridges that are not the ETH bridge should not be able to handle or even
            // present ETH deposits or withdrawals.
            return (!(0, core_utils_1.hexStringEquals)(event.args.l1Token, ethers_1.ethers.constants.AddressZero) &&
                !(0, core_utils_1.hexStringEquals)(event.args.l2Token, contracts_1.predeploys.OVM_ETH));
        })
            .map((event) => {
            return {
                direction: interfaces_1.MessageDirection.L2_TO_L1,
                from: event.args.from,
                to: event.args.to,
                l1Token: event.args.l1Token,
                l2Token: event.args.l2Token,
                amount: event.args.amount,
                data: event.args.extraData,
                logIndex: event.logIndex,
                blockNumber: event.blockNumber,
                transactionHash: event.transactionHash,
            };
        })
            .sort((a, b) => {
            // Sort descending by block number
            return b.blockNumber - a.blockNumber;
        });
    }
    async supportsTokenPair(l1Token, l2Token) {
        try {
            const contract = new ethers_1.Contract((0, utils_1.toAddress)(l2Token), OptimismMintableERC20_json_1.default.abi, this.messenger.l2Provider);
            // Don't support ETH deposits or withdrawals via this bridge.
            if ((0, core_utils_1.hexStringEquals)((0, utils_1.toAddress)(l1Token), ethers_1.ethers.constants.AddressZero) ||
                (0, core_utils_1.hexStringEquals)((0, utils_1.toAddress)(l2Token), contracts_1.predeploys.OVM_ETH)) {
                return false;
            }
            // Make sure the L1 token matches.
            const remoteL1Token = await contract.l1Token();
            if (!(0, core_utils_1.hexStringEquals)(remoteL1Token, (0, utils_1.toAddress)(l1Token))) {
                return false;
            }
            // Make sure the L2 bridge matches.
            const remoteL2Bridge = await contract.l2Bridge();
            if (!(0, core_utils_1.hexStringEquals)(remoteL2Bridge, this.l2Bridge.address)) {
                return false;
            }
            return true;
        }
        catch (err) {
            // If the L2 token is not an L2StandardERC20, it may throw an error. If there's a call
            // exception then we assume that the token is not supported. Other errors are thrown. Since
            // the JSON-RPC API is not well-specified, we need to handle multiple possible error codes.
            if (!err?.message?.toString().includes('CALL_EXCEPTION') &&
                !err?.stack?.toString().includes('execution reverted')) {
                console.error('Unexpected error when checking bridge', err);
            }
            return false;
        }
    }
    async approval(l1Token, l2Token, signer) {
        if (!(await this.supportsTokenPair(l1Token, l2Token))) {
            throw new Error(`token pair not supported by bridge`);
        }
        const token = new ethers_1.Contract((0, utils_1.toAddress)(l1Token), OptimismMintableERC20_json_1.default.abi, this.messenger.l1Provider);
        return token.allowance(await signer.getAddress(), this.l1Bridge.address);
    }
    async approve(l1Token, l2Token, amount, signer, opts) {
        return signer.sendTransaction(await this.populateTransaction.approve(l1Token, l2Token, amount, opts));
    }
    async deposit(l1Token, l2Token, amount, signer, opts) {
        return signer.sendTransaction(await this.populateTransaction.deposit(l1Token, l2Token, amount, opts));
    }
    async withdraw(l1Token, l2Token, amount, signer, opts) {
        return signer.sendTransaction(await this.populateTransaction.withdraw(l1Token, l2Token, amount, opts));
    }
}
exports.StandardBridgeAdapter = StandardBridgeAdapter;
