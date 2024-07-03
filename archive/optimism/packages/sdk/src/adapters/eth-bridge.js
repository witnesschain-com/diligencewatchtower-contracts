"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ETHBridgeAdapter = void 0;
/* eslint-disable @typescript-eslint/no-unused-vars */
const ethers_1 = require("ethers");
const contracts_1 = require("@eth-optimism/contracts");
const core_utils_1 = require("@eth-optimism/core-utils");
const interfaces_1 = require("../interfaces");
const utils_1 = require("../utils");
const standard_bridge_1 = require("./standard-bridge");
/**
 * Bridge adapter for the ETH bridge.
 */
class ETHBridgeAdapter extends standard_bridge_1.StandardBridgeAdapter {
    constructor() {
        super(...arguments);
        this.populateTransaction = {
            approve: async (l1Token, l2Token, amount, opts) => {
                throw new Error(`approvals not necessary for ETH bridge`);
            },
            deposit: async (l1Token, l2Token, amount, opts) => {
                if (!(await this.supportsTokenPair(l1Token, l2Token))) {
                    throw new Error(`token pair not supported by bridge`);
                }
                if (opts?.recipient === undefined) {
                    return this.l1Bridge.populateTransaction.depositETH(opts?.l2GasLimit || 200000, // Default to 200k gas limit.
                    '0x', // No data.
                    {
                        ...(0, utils_1.omit)(opts?.overrides || {}, 'value'),
                        value: amount,
                    });
                }
                else {
                    return this.l1Bridge.populateTransaction.depositETHTo((0, utils_1.toAddress)(opts.recipient), opts?.l2GasLimit || 200000, // Default to 200k gas limit.
                    '0x', // No data.
                    {
                        ...(0, utils_1.omit)(opts?.overrides || {}, 'value'),
                        value: amount,
                    });
                }
            },
            withdraw: async (l1Token, l2Token, amount, opts) => {
                if (!(await this.supportsTokenPair(l1Token, l2Token))) {
                    throw new Error(`token pair not supported by bridge`);
                }
                if (opts?.recipient === undefined) {
                    return this.l2Bridge.populateTransaction.withdraw((0, utils_1.toAddress)(l2Token), amount, 0, // L1 gas not required.
                    '0x', // No data.
                    {
                        ...(0, utils_1.omit)(opts?.overrides || {}, 'value'),
                        value: this.messenger.bedrock ? amount : 0,
                    });
                }
                else {
                    return this.l2Bridge.populateTransaction.withdrawTo((0, utils_1.toAddress)(l2Token), (0, utils_1.toAddress)(opts.recipient), amount, 0, // L1 gas not required.
                    '0x', // No data.
                    {
                        ...(0, utils_1.omit)(opts?.overrides || {}, 'value'),
                        value: this.messenger.bedrock ? amount : 0,
                    });
                }
            },
        };
    }
    async approval(l1Token, l2Token, signer) {
        throw new Error(`approval not necessary for ETH bridge`);
    }
    async getDepositsByAddress(address, opts) {
        const events = await this.l1Bridge.queryFilter(this.l1Bridge.filters.ETHDepositInitiated(address), opts?.fromBlock, opts?.toBlock);
        return events
            .map((event) => {
            return {
                direction: interfaces_1.MessageDirection.L1_TO_L2,
                from: event.args.from,
                to: event.args.to,
                l1Token: ethers_1.ethers.constants.AddressZero,
                l2Token: contracts_1.predeploys.OVM_ETH,
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
            // Only find ETH withdrawals.
            return ((0, core_utils_1.hexStringEquals)(event.args.l1Token, ethers_1.ethers.constants.AddressZero) &&
                (0, core_utils_1.hexStringEquals)(event.args.l2Token, contracts_1.predeploys.OVM_ETH));
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
        // Only support ETH deposits and withdrawals.
        return ((0, core_utils_1.hexStringEquals)((0, utils_1.toAddress)(l1Token), ethers_1.ethers.constants.AddressZero) &&
            (0, core_utils_1.hexStringEquals)((0, utils_1.toAddress)(l2Token), contracts_1.predeploys.OVM_ETH));
    }
}
exports.ETHBridgeAdapter = ETHBridgeAdapter;
