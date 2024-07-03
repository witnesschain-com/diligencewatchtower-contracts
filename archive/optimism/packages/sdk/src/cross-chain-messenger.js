"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrossChainMessenger = void 0;
/* eslint-disable @typescript-eslint/no-unused-vars */
const abstract_provider_1 = require("@ethersproject/abstract-provider");
const ethers_1 = require("ethers");
const core_utils_1 = require("@eth-optimism/core-utils");
const contracts_1 = require("@eth-optimism/contracts");
const rlp = __importStar(require("rlp"));
const interfaces_1 = require("./interfaces");
const utils_1 = require("./utils");
class CrossChainMessenger {
    /**
     * Creates a new CrossChainProvider instance.
     *
     * @param opts Options for the provider.
     * @param opts.l1SignerOrProvider Signer or Provider for the L1 chain, or a JSON-RPC url.
     * @param opts.l2SignerOrProvider Signer or Provider for the L2 chain, or a JSON-RPC url.
     * @param opts.l1ChainId Chain ID for the L1 chain.
     * @param opts.l2ChainId Chain ID for the L2 chain.
     * @param opts.depositConfirmationBlocks Optional number of blocks before a deposit is confirmed.
     * @param opts.l1BlockTimeSeconds Optional estimated block time in seconds for the L1 chain.
     * @param opts.contracts Optional contract address overrides.
     * @param opts.bridges Optional bridge address list.
     * @param opts.bedrock Whether or not to enable Bedrock compatibility.
     */
    constructor(opts) {
        /**
         * Object that holds the functions that generate transactions to be signed by the user.
         * Follows the pattern used by ethers.js.
         */
        this.populateTransaction = {
            /**
             * Generates a transaction that sends a given cross chain message. This transaction can be signed
             * and executed by a signer.
             *
             * @param message Cross chain message to send.
             * @param opts Additional options.
             * @param opts.l2GasLimit Optional gas limit to use for the transaction on L2.
             * @param opts.overrides Optional transaction overrides.
             * @returns Transaction that can be signed and executed to send the message.
             */
            sendMessage: async (message, opts) => {
                if (message.direction === interfaces_1.MessageDirection.L1_TO_L2) {
                    return this.contracts.l1.L1CrossDomainMessenger.populateTransaction.sendMessage(message.target, message.message, opts?.l2GasLimit || (await this.estimateL2MessageGasLimit(message)), opts?.overrides || {});
                }
                else {
                    return this.contracts.l2.L2CrossDomainMessenger.populateTransaction.sendMessage(message.target, message.message, 0, // Gas limit goes unused when sending from L2 to L1
                    opts?.overrides || {});
                }
            },
            /**
             * Generates a transaction that resends a given cross chain message. Only applies to L1 to L2
             * messages. This transaction can be signed and executed by a signer.
             *
             * @param message Cross chain message to resend.
             * @param messageGasLimit New gas limit to use for the message.
             * @param opts Additional options.
             * @param opts.overrides Optional transaction overrides.
             * @returns Transaction that can be signed and executed to resend the message.
             */
            resendMessage: async (message, messageGasLimit, opts) => {
                const resolved = await this.toCrossChainMessage(message);
                if (resolved.direction === interfaces_1.MessageDirection.L2_TO_L1) {
                    throw new Error(`cannot resend L2 to L1 message`);
                }
                if (this.bedrock) {
                    return this.populateTransaction.finalizeMessage(resolved, {
                        ...(opts || {}),
                        overrides: {
                            ...opts?.overrides,
                            gasLimit: messageGasLimit,
                        },
                    });
                }
                else {
                    const legacyL1XDM = new ethers_1.ethers.Contract(this.contracts.l1.L1CrossDomainMessenger.address, (0, contracts_1.getContractInterface)('L1CrossDomainMessenger'), this.l1SignerOrProvider);
                    return legacyL1XDM.populateTransaction.replayMessage(resolved.target, resolved.sender, resolved.message, resolved.messageNonce, resolved.minGasLimit, messageGasLimit, opts?.overrides || {});
                }
            },
            /**
             * Generates a message proving transaction that can be signed and executed. Only
             * applicable for L2 to L1 messages.
             *
             * @param message Message to generate the proving transaction for.
             * @param opts Additional options.
             * @param opts.overrides Optional transaction overrides.
             * @returns Transaction that can be signed and executed to prove the message.
             */
            proveMessage: async (message, opts) => {
                const resolved = await this.toCrossChainMessage(message);
                if (resolved.direction === interfaces_1.MessageDirection.L1_TO_L2) {
                    throw new Error('cannot finalize L1 to L2 message');
                }
                if (!this.bedrock) {
                    throw new Error('message proving only applies after the bedrock upgrade');
                }
                const withdrawal = await this.toLowLevelMessage(resolved);
                const proof = await this.getBedrockMessageProof(resolved);
                const args = [
                    [
                        withdrawal.messageNonce,
                        withdrawal.sender,
                        withdrawal.target,
                        withdrawal.value,
                        withdrawal.minGasLimit,
                        withdrawal.message,
                    ],
                    proof.l2OutputIndex,
                    [
                        proof.outputRootProof.version,
                        proof.outputRootProof.stateRoot,
                        proof.outputRootProof.messagePasserStorageRoot,
                        proof.outputRootProof.latestBlockhash,
                    ],
                    proof.withdrawalProof,
                    opts?.overrides || {},
                ];
                return this.contracts.l1.OptimismPortal.populateTransaction.proveWithdrawalTransaction(...args);
            },
            /**
             * Generates a message finalization transaction that can be signed and executed. Only
             * applicable for L2 to L1 messages. Will throw an error if the message has not completed
             * its challenge period yet.
             *
             * @param message Message to generate the finalization transaction for.
             * @param opts Additional options.
             * @param opts.overrides Optional transaction overrides.
             * @returns Transaction that can be signed and executed to finalize the message.
             */
            finalizeMessage: async (message, opts) => {
                const resolved = await this.toCrossChainMessage(message);
                if (resolved.direction === interfaces_1.MessageDirection.L1_TO_L2) {
                    throw new Error(`cannot finalize L1 to L2 message`);
                }
                if (this.bedrock) {
                    const withdrawal = await this.toLowLevelMessage(resolved);
                    return this.contracts.l1.OptimismPortal.populateTransaction.finalizeWithdrawalTransaction([
                        withdrawal.messageNonce,
                        withdrawal.sender,
                        withdrawal.target,
                        withdrawal.value,
                        withdrawal.minGasLimit,
                        withdrawal.message,
                    ], opts?.overrides || {});
                }
                else {
                    // L1CrossDomainMessenger relayMessage is the only method that isn't fully backwards
                    // compatible, so we need to use the legacy interface. When we fully upgrade to Bedrock we
                    // should be able to remove this code.
                    const proof = await this.getMessageProof(resolved);
                    const legacyL1XDM = new ethers_1.ethers.Contract(this.contracts.l1.L1CrossDomainMessenger.address, (0, contracts_1.getContractInterface)('L1CrossDomainMessenger'), this.l1SignerOrProvider);
                    return legacyL1XDM.populateTransaction.relayMessage(resolved.target, resolved.sender, resolved.message, resolved.messageNonce, proof, opts?.overrides || {});
                }
            },
            /**
             * Generates a transaction for depositing some ETH into the L2 chain.
             *
             * @param amount Amount of ETH to deposit.
             * @param opts Additional options.
             * @param opts.recipient Optional address to receive the funds on L2. Defaults to sender.
             * @param opts.l2GasLimit Optional gas limit to use for the transaction on L2.
             * @param opts.overrides Optional transaction overrides.
             * @returns Transaction that can be signed and executed to deposit the ETH.
             */
            depositETH: async (amount, opts, isEstimatingGas = false) => {
                const getOpts = async () => {
                    if (isEstimatingGas) {
                        return opts;
                    }
                    const gasEstimation = await this.estimateGas.depositETH(amount, opts);
                    return {
                        ...opts,
                        overrides: {
                            ...opts?.overrides,
                            gasLimit: gasEstimation.add(gasEstimation.div(2)),
                        },
                    };
                };
                return this.bridges.ETH.populateTransaction.deposit(ethers_1.ethers.constants.AddressZero, contracts_1.predeploys.OVM_ETH, amount, await getOpts());
            },
            /**
             * Generates a transaction for withdrawing some ETH back to the L1 chain.
             *
             * @param amount Amount of ETH to withdraw.
             * @param opts Additional options.
             * @param opts.recipient Optional address to receive the funds on L1. Defaults to sender.
             * @param opts.overrides Optional transaction overrides.
             * @returns Transaction that can be signed and executed to withdraw the ETH.
             */
            withdrawETH: async (amount, opts) => {
                return this.bridges.ETH.populateTransaction.withdraw(ethers_1.ethers.constants.AddressZero, contracts_1.predeploys.OVM_ETH, amount, opts);
            },
            /**
             * Generates a transaction for approving some tokens to deposit into the L2 chain.
             *
             * @param l1Token The L1 token address.
             * @param l2Token The L2 token address.
             * @param amount Amount of the token to approve.
             * @param opts Additional options.
             * @param opts.overrides Optional transaction overrides.
             * @returns Transaction response for the approval transaction.
             */
            approveERC20: async (l1Token, l2Token, amount, opts) => {
                const bridge = await this.getBridgeForTokenPair(l1Token, l2Token);
                return bridge.populateTransaction.approve(l1Token, l2Token, amount, opts);
            },
            /**
             * Generates a transaction for depositing some ERC20 tokens into the L2 chain.
             *
             * @param l1Token Address of the L1 token.
             * @param l2Token Address of the L2 token.
             * @param amount Amount to deposit.
             * @param opts Additional options.
             * @param opts.recipient Optional address to receive the funds on L2. Defaults to sender.
             * @param opts.l2GasLimit Optional gas limit to use for the transaction on L2.
             * @param opts.overrides Optional transaction overrides.
             * @returns Transaction that can be signed and executed to deposit the tokens.
             */
            depositERC20: async (l1Token, l2Token, amount, opts, isEstimatingGas = false) => {
                const bridge = await this.getBridgeForTokenPair(l1Token, l2Token);
                // we need extra buffer for gas limit
                const getOpts = async () => {
                    if (isEstimatingGas) {
                        return opts;
                    }
                    // if we don't include the users address the estimation will fail from lack of allowance
                    if (!ethers_1.ethers.Signer.isSigner(this.l1SignerOrProvider)) {
                        throw new Error('unable to deposit without an l1 signer');
                    }
                    const from = this.l1SignerOrProvider.getAddress();
                    const gasEstimation = await this.estimateGas.depositERC20(l1Token, l2Token, amount, {
                        ...opts,
                        overrides: {
                            ...opts?.overrides,
                            from: opts?.overrides?.from ?? from,
                        },
                    });
                    return {
                        ...opts,
                        overrides: {
                            ...opts?.overrides,
                            gasLimit: gasEstimation.add(gasEstimation.div(2)),
                            from: opts?.overrides?.from ?? from,
                        },
                    };
                };
                return bridge.populateTransaction.deposit(l1Token, l2Token, amount, await getOpts());
            },
            /**
             * Generates a transaction for withdrawing some ERC20 tokens back to the L1 chain.
             *
             * @param l1Token Address of the L1 token.
             * @param l2Token Address of the L2 token.
             * @param amount Amount to withdraw.
             * @param opts Additional options.
             * @param opts.recipient Optional address to receive the funds on L1. Defaults to sender.
             * @param opts.overrides Optional transaction overrides.
             * @returns Transaction that can be signed and executed to withdraw the tokens.
             */
            withdrawERC20: async (l1Token, l2Token, amount, opts) => {
                const bridge = await this.getBridgeForTokenPair(l1Token, l2Token);
                return bridge.populateTransaction.withdraw(l1Token, l2Token, amount, opts);
            },
        };
        /**
         * Object that holds the functions that estimates the gas required for a given transaction.
         * Follows the pattern used by ethers.js.
         */
        this.estimateGas = {
            /**
             * Estimates gas required to send a cross chain message.
             *
             * @param message Cross chain message to send.
             * @param opts Additional options.
             * @param opts.l2GasLimit Optional gas limit to use for the transaction on L2.
             * @param opts.overrides Optional transaction overrides.
             * @returns Gas estimate for the transaction.
             */
            sendMessage: async (message, opts) => {
                const tx = await this.populateTransaction.sendMessage(message, opts);
                if (message.direction === interfaces_1.MessageDirection.L1_TO_L2) {
                    return this.l1Provider.estimateGas(tx);
                }
                else {
                    return this.l2Provider.estimateGas(tx);
                }
            },
            /**
             * Estimates gas required to resend a cross chain message. Only applies to L1 to L2 messages.
             *
             * @param message Cross chain message to resend.
             * @param messageGasLimit New gas limit to use for the message.
             * @param opts Additional options.
             * @param opts.overrides Optional transaction overrides.
             * @returns Gas estimate for the transaction.
             */
            resendMessage: async (message, messageGasLimit, opts) => {
                return this.l1Provider.estimateGas(await this.populateTransaction.resendMessage(message, messageGasLimit, opts));
            },
            /**
             * Estimates gas required to prove a cross chain message. Only applies to L2 to L1 messages.
             *
             * @param message Message to generate the proving transaction for.
             * @param opts Additional options.
             * @param opts.overrides Optional transaction overrides.
             * @returns Gas estimate for the transaction.
             */
            proveMessage: async (message, opts) => {
                return this.l1Provider.estimateGas(await this.populateTransaction.proveMessage(message, opts));
            },
            /**
             * Estimates gas required to finalize a cross chain message. Only applies to L2 to L1 messages.
             *
             * @param message Message to generate the finalization transaction for.
             * @param opts Additional options.
             * @param opts.overrides Optional transaction overrides.
             * @returns Gas estimate for the transaction.
             */
            finalizeMessage: async (message, opts) => {
                return this.l1Provider.estimateGas(await this.populateTransaction.finalizeMessage(message, opts));
            },
            /**
             * Estimates gas required to deposit some ETH into the L2 chain.
             *
             * @param amount Amount of ETH to deposit.
             * @param opts Additional options.
             * @param opts.recipient Optional address to receive the funds on L2. Defaults to sender.
             * @param opts.l2GasLimit Optional gas limit to use for the transaction on L2.
             * @param opts.overrides Optional transaction overrides.
             * @returns Gas estimate for the transaction.
             */
            depositETH: async (amount, opts) => {
                return this.l1Provider.estimateGas(await this.populateTransaction.depositETH(amount, opts, true));
            },
            /**
             * Estimates gas required to withdraw some ETH back to the L1 chain.
             *
             * @param amount Amount of ETH to withdraw.
             * @param opts Additional options.
             * @param opts.recipient Optional address to receive the funds on L1. Defaults to sender.
             * @param opts.overrides Optional transaction overrides.
             * @returns Gas estimate for the transaction.
             */
            withdrawETH: async (amount, opts) => {
                return this.l2Provider.estimateGas(await this.populateTransaction.withdrawETH(amount, opts));
            },
            /**
             * Estimates gas required to approve some tokens to deposit into the L2 chain.
             *
             * @param l1Token The L1 token address.
             * @param l2Token The L2 token address.
             * @param amount Amount of the token to approve.
             * @param opts Additional options.
             * @param opts.overrides Optional transaction overrides.
             * @returns Transaction response for the approval transaction.
             */
            approveERC20: async (l1Token, l2Token, amount, opts) => {
                return this.l1Provider.estimateGas(await this.populateTransaction.approveERC20(l1Token, l2Token, amount, opts));
            },
            /**
             * Estimates gas required to deposit some ERC20 tokens into the L2 chain.
             *
             * @param l1Token Address of the L1 token.
             * @param l2Token Address of the L2 token.
             * @param amount Amount to deposit.
             * @param opts Additional options.
             * @param opts.recipient Optional address to receive the funds on L2. Defaults to sender.
             * @param opts.l2GasLimit Optional gas limit to use for the transaction on L2.
             * @param opts.overrides Optional transaction overrides.
             * @returns Gas estimate for the transaction.
             */
            depositERC20: async (l1Token, l2Token, amount, opts) => {
                return this.l1Provider.estimateGas(await this.populateTransaction.depositERC20(l1Token, l2Token, amount, opts, true));
            },
            /**
             * Estimates gas required to withdraw some ERC20 tokens back to the L1 chain.
             *
             * @param l1Token Address of the L1 token.
             * @param l2Token Address of the L2 token.
             * @param amount Amount to withdraw.
             * @param opts Additional options.
             * @param opts.recipient Optional address to receive the funds on L1. Defaults to sender.
             * @param opts.overrides Optional transaction overrides.
             * @returns Gas estimate for the transaction.
             */
            withdrawERC20: async (l1Token, l2Token, amount, opts) => {
                return this.l2Provider.estimateGas(await this.populateTransaction.withdrawERC20(l1Token, l2Token, amount, opts));
            },
        };
        this.bedrock = opts.bedrock ?? true;
        this.l1SignerOrProvider = (0, utils_1.toSignerOrProvider)(opts.l1SignerOrProvider);
        this.l2SignerOrProvider = (0, utils_1.toSignerOrProvider)(opts.l2SignerOrProvider);
        try {
            this.l1ChainId = (0, utils_1.toNumber)(opts.l1ChainId);
        }
        catch (err) {
            throw new Error(`L1 chain ID is missing or invalid: ${opts.l1ChainId}`);
        }
        try {
            this.l2ChainId = (0, utils_1.toNumber)(opts.l2ChainId);
        }
        catch (err) {
            throw new Error(`L2 chain ID is missing or invalid: ${opts.l2ChainId}`);
        }
        this.depositConfirmationBlocks =
            opts?.depositConfirmationBlocks !== undefined
                ? (0, utils_1.toNumber)(opts.depositConfirmationBlocks)
                : utils_1.DEPOSIT_CONFIRMATION_BLOCKS[this.l2ChainId] || 0;
        this.l1BlockTimeSeconds =
            opts?.l1BlockTimeSeconds !== undefined
                ? (0, utils_1.toNumber)(opts.l1BlockTimeSeconds)
                : utils_1.CHAIN_BLOCK_TIMES[this.l1ChainId] || 1;
        this.contracts = (0, utils_1.getAllOEContracts)(this.l2ChainId, {
            l1SignerOrProvider: this.l1SignerOrProvider,
            l2SignerOrProvider: this.l2SignerOrProvider,
            overrides: opts.contracts,
        });
        this.bridges = (0, utils_1.getBridgeAdapters)(this.l2ChainId, this, {
            overrides: opts.bridges,
            contracts: opts.contracts,
        });
    }
    /**
     * Provider connected to the L1 chain.
     */
    get l1Provider() {
        if (abstract_provider_1.Provider.isProvider(this.l1SignerOrProvider)) {
            return this.l1SignerOrProvider;
        }
        else {
            return this.l1SignerOrProvider.provider;
        }
    }
    /**
     * Provider connected to the L2 chain.
     */
    get l2Provider() {
        if (abstract_provider_1.Provider.isProvider(this.l2SignerOrProvider)) {
            return this.l2SignerOrProvider;
        }
        else {
            return this.l2SignerOrProvider.provider;
        }
    }
    /**
     * Signer connected to the L1 chain.
     */
    get l1Signer() {
        if (abstract_provider_1.Provider.isProvider(this.l1SignerOrProvider)) {
            throw new Error(`messenger has no L1 signer`);
        }
        else {
            return this.l1SignerOrProvider;
        }
    }
    /**
     * Signer connected to the L2 chain.
     */
    get l2Signer() {
        if (abstract_provider_1.Provider.isProvider(this.l2SignerOrProvider)) {
            throw new Error(`messenger has no L2 signer`);
        }
        else {
            return this.l2SignerOrProvider;
        }
    }
    /**
     * Retrieves all cross chain messages sent within a given transaction.
     *
     * @param transaction Transaction hash or receipt to find messages from.
     * @param opts Options object.
     * @param opts.direction Direction to search for messages in. If not provided, will attempt to
     * automatically search both directions under the assumption that a transaction hash will only
     * exist on one chain. If the hash exists on both chains, will throw an error.
     * @returns All cross chain messages sent within the transaction.
     */
    async getMessagesByTransaction(transaction, opts = {}) {
        // Wait for the transaction receipt if the input is waitable.
        await transaction.wait?.();
        // Convert the input to a transaction hash.
        const txHash = (0, utils_1.toTransactionHash)(transaction);
        let receipt;
        if (opts.direction !== undefined) {
            // Get the receipt for the requested direction.
            if (opts.direction === interfaces_1.MessageDirection.L1_TO_L2) {
                receipt = await this.l1Provider.getTransactionReceipt(txHash);
            }
            else {
                receipt = await this.l2Provider.getTransactionReceipt(txHash);
            }
        }
        else {
            // Try both directions, starting with L1 => L2.
            receipt = await this.l1Provider.getTransactionReceipt(txHash);
            if (receipt) {
                opts.direction = interfaces_1.MessageDirection.L1_TO_L2;
            }
            else {
                receipt = await this.l2Provider.getTransactionReceipt(txHash);
                opts.direction = interfaces_1.MessageDirection.L2_TO_L1;
            }
        }
        if (!receipt) {
            throw new Error(`unable to find transaction receipt for ${txHash}`);
        }
        // By this point opts.direction will always be defined.
        const messenger = opts.direction === interfaces_1.MessageDirection.L1_TO_L2
            ? this.contracts.l1.L1CrossDomainMessenger
            : this.contracts.l2.L2CrossDomainMessenger;
        return receipt.logs
            .filter((log) => {
            // Only look at logs emitted by the messenger address
            return log.address === messenger.address;
        })
            .filter((log) => {
            // Only look at SentMessage logs specifically
            const parsed = messenger.interface.parseLog(log);
            return parsed.name === 'SentMessage';
        })
            .map((log) => {
            // Try to pull out the value field, but only if the very next log is a SentMessageExtension1
            // event which was introduced in the Bedrock upgrade.
            let value = ethers_1.ethers.BigNumber.from(0);
            const next = receipt.logs.find((l) => {
                return (l.logIndex === log.logIndex + 1 && l.address === messenger.address);
            });
            if (next) {
                const nextParsed = messenger.interface.parseLog(next);
                if (nextParsed.name === 'SentMessageExtension1') {
                    value = nextParsed.args.value;
                }
            }
            // Convert each SentMessage log into a message object
            const parsed = messenger.interface.parseLog(log);
            return {
                direction: opts.direction,
                target: parsed.args.target,
                sender: parsed.args.sender,
                message: parsed.args.message,
                messageNonce: parsed.args.messageNonce,
                value,
                minGasLimit: parsed.args.gasLimit,
                logIndex: log.logIndex,
                blockNumber: log.blockNumber,
                transactionHash: log.transactionHash,
            };
        });
    }
    /**
     * Transforms a legacy message into its corresponding Bedrock representation.
     *
     * @param message Legacy message to transform.
     * @returns Bedrock representation of the message.
     */
    async toBedrockCrossChainMessage(message) {
        const resolved = await this.toCrossChainMessage(message);
        // Bedrock messages are already in the correct format.
        const { version } = (0, core_utils_1.decodeVersionedNonce)(resolved.messageNonce);
        if (version.eq(1)) {
            return resolved;
        }
        let value = ethers_1.BigNumber.from(0);
        if (resolved.direction === interfaces_1.MessageDirection.L2_TO_L1 &&
            resolved.sender === this.contracts.l2.L2StandardBridge.address &&
            resolved.target === this.contracts.l1.L1StandardBridge.address) {
            try {
                ;
                [, , value] =
                    this.contracts.l1.L1StandardBridge.interface.decodeFunctionData('finalizeETHWithdrawal', resolved.message);
            }
            catch (err) {
                // No problem, not a message with value.
            }
        }
        return {
            ...resolved,
            value,
            minGasLimit: ethers_1.BigNumber.from(0),
            messageNonce: (0, core_utils_1.encodeVersionedNonce)(ethers_1.BigNumber.from(0), resolved.messageNonce),
        };
    }
    /**
     * Transforms a CrossChainMessenger message into its low-level representation inside the
     * L2ToL1MessagePasser contract on L2.
     *
     * @param message Message to transform.
     * @return Transformed message.
     */
    async toLowLevelMessage(message) {
        const resolved = await this.toCrossChainMessage(message);
        if (resolved.direction === interfaces_1.MessageDirection.L1_TO_L2) {
            throw new Error(`can only convert L2 to L1 messages to low level`);
        }
        // We may have to update the message if it's a legacy message.
        const { version } = (0, core_utils_1.decodeVersionedNonce)(resolved.messageNonce);
        let updated;
        if (version.eq(0)) {
            updated = await this.toBedrockCrossChainMessage(resolved);
        }
        else {
            updated = resolved;
        }
        // Encode the updated message, we need this for legacy messages.
        const encoded = (0, core_utils_1.encodeCrossDomainMessageV1)(updated.messageNonce, updated.sender, updated.target, updated.value, updated.minGasLimit, updated.message);
        // We need to figure out the final withdrawal data that was used to compute the withdrawal hash
        // inside the L2ToL1Message passer contract. Exact mechanism here depends on whether or not
        // this is a legacy message or a new Bedrock message.
        let gasLimit;
        let messageNonce;
        if (version.eq(0)) {
            const chainID = await (0, core_utils_1.getChainId)(this.l2Provider);
            gasLimit = (0, utils_1.migratedWithdrawalGasLimit)(encoded, chainID);
            messageNonce = resolved.messageNonce;
        }
        else {
            const receipt = await this.l2Provider.getTransactionReceipt(resolved.transactionHash);
            const withdrawals = [];
            for (const log of receipt.logs) {
                if (log.address === this.contracts.l2.BedrockMessagePasser.address) {
                    const decoded = this.contracts.l2.L2ToL1MessagePasser.interface.parseLog(log);
                    if (decoded.name === 'MessagePassed') {
                        withdrawals.push(decoded.args);
                    }
                }
            }
            // Should not happen.
            if (withdrawals.length === 0) {
                throw new Error(`no withdrawals found in receipt`);
            }
            // TODO: Add support for multiple withdrawals.
            if (withdrawals.length > 1) {
                throw new Error(`multiple withdrawals found in receipt`);
            }
            const withdrawal = withdrawals[0];
            messageNonce = withdrawal.nonce;
            gasLimit = withdrawal.gasLimit;
        }
        return {
            messageNonce,
            sender: this.contracts.l2.L2CrossDomainMessenger.address,
            target: this.contracts.l1.L1CrossDomainMessenger.address,
            value: updated.value,
            minGasLimit: gasLimit,
            message: encoded,
        };
    }
    // public async getMessagesByAddress(
    //   address: AddressLike,
    //   opts?: {
    //     direction?: MessageDirection
    //     fromBlock?: NumberLike
    //     toBlock?: NumberLike
    //   }
    // ): Promise<CrossChainMessage[]> {
    //   throw new Error(`
    //     The function getMessagesByAddress is currently not enabled because the sender parameter of
    //     the SentMessage event is not indexed within the CrossChainMessenger contracts.
    //     getMessagesByAddress will be enabled by plugging in an Optimism Indexer (coming soon).
    //     See the following issue on GitHub for additional context:
    //     https://github.com/ethereum-optimism/optimism/issues/2129
    //   `)
    // }
    /**
     * Finds the appropriate bridge adapter for a given L1<>L2 token pair. Will throw if no bridges
     * support the token pair or if more than one bridge supports the token pair.
     *
     * @param l1Token L1 token address.
     * @param l2Token L2 token address.
     * @returns The appropriate bridge adapter for the given token pair.
     */
    async getBridgeForTokenPair(l1Token, l2Token) {
        const bridges = [];
        for (const bridge of Object.values(this.bridges)) {
            if (await bridge.supportsTokenPair(l1Token, l2Token)) {
                bridges.push(bridge);
            }
        }
        if (bridges.length === 0) {
            throw new Error(`no supported bridge for token pair`);
        }
        if (bridges.length > 1) {
            throw new Error(`found more than one bridge for token pair`);
        }
        return bridges[0];
    }
    /**
     * Gets all deposits for a given address.
     *
     * @param address Address to search for messages from.
     * @param opts Options object.
     * @param opts.fromBlock Block to start searching for messages from. If not provided, will start
     * from the first block (block #0).
     * @param opts.toBlock Block to stop searching for messages at. If not provided, will stop at the
     * latest known block ("latest").
     * @returns All deposit token bridge messages sent by the given address.
     */
    async getDepositsByAddress(address, opts = {}) {
        return (await Promise.all(Object.values(this.bridges).map(async (bridge) => {
            return bridge.getDepositsByAddress(address, opts);
        })))
            .reduce((acc, val) => {
            return acc.concat(val);
        }, [])
            .sort((a, b) => {
            // Sort descending by block number
            return b.blockNumber - a.blockNumber;
        });
    }
    /**
     * Gets all withdrawals for a given address.
     *
     * @param address Address to search for messages from.
     * @param opts Options object.
     * @param opts.fromBlock Block to start searching for messages from. If not provided, will start
     * from the first block (block #0).
     * @param opts.toBlock Block to stop searching for messages at. If not provided, will stop at the
     * latest known block ("latest").
     * @returns All withdrawal token bridge messages sent by the given address.
     */
    async getWithdrawalsByAddress(address, opts = {}) {
        return (await Promise.all(Object.values(this.bridges).map(async (bridge) => {
            return bridge.getWithdrawalsByAddress(address, opts);
        })))
            .reduce((acc, val) => {
            return acc.concat(val);
        }, [])
            .sort((a, b) => {
            // Sort descending by block number
            return b.blockNumber - a.blockNumber;
        });
    }
    /**
     * Resolves a MessageLike into a CrossChainMessage object.
     * Unlike other coercion functions, this function is stateful and requires making additional
     * requests. For now I'm going to keep this function here, but we could consider putting a
     * similar function inside of utils/coercion.ts if people want to use this without having to
     * create an entire CrossChainProvider object.
     *
     * @param message MessageLike to resolve into a CrossChainMessage.
     * @returns Message coerced into a CrossChainMessage.
     */
    async toCrossChainMessage(message) {
        if (!message) {
            throw new Error('message is undefined');
        }
        // TODO: Convert these checks into proper type checks.
        if (message.message) {
            return message;
        }
        else if (message.l1Token &&
            message.l2Token &&
            message.transactionHash) {
            const messages = await this.getMessagesByTransaction(message.transactionHash);
            // The `messages` object corresponds to a list of SentMessage events that were triggered by
            // the same transaction. We want to find the specific SentMessage event that corresponds to
            // the TokenBridgeMessage (either a ETHDepositInitiated, ERC20DepositInitiated, or
            // WithdrawalInitiated event). We expect the behavior of bridge contracts to be that these
            // TokenBridgeMessage events are triggered and then a SentMessage event is triggered. Our
            // goal here is therefore to find the first SentMessage event that comes after the input
            // event.
            const found = messages
                .sort((a, b) => {
                // Sort all messages in ascending order by log index.
                return a.logIndex - b.logIndex;
            })
                .find((m) => {
                return m.logIndex > message.logIndex;
            });
            if (!found) {
                throw new Error(`could not find SentMessage event for message`);
            }
            return found;
        }
        else {
            // TODO: Explicit TransactionLike check and throw if not TransactionLike
            const messages = await this.getMessagesByTransaction(message);
            // We only want to treat TransactionLike objects as MessageLike if they only emit a single
            // message (very common). It's unintuitive to treat a TransactionLike as a MessageLike if
            // they emit more than one message (which message do you pick?), so we throw an error.
            if (messages.length !== 1) {
                throw new Error(`expected 1 message, got ${messages.length}`);
            }
            return messages[0];
        }
    }
    /**
     * Retrieves the status of a particular message as an enum.
     *
     * @param message Cross chain message to check the status of.
     * @returns Status of the message.
     */
    async getMessageStatus(message) {
        const resolved = await this.toCrossChainMessage(message);
        const receipt = await this.getMessageReceipt(resolved);
        if (resolved.direction === interfaces_1.MessageDirection.L1_TO_L2) {
            if (receipt === null) {
                return interfaces_1.MessageStatus.UNCONFIRMED_L1_TO_L2_MESSAGE;
            }
            else {
                if (receipt.receiptStatus === interfaces_1.MessageReceiptStatus.RELAYED_SUCCEEDED) {
                    return interfaces_1.MessageStatus.RELAYED;
                }
                else {
                    return interfaces_1.MessageStatus.FAILED_L1_TO_L2_MESSAGE;
                }
            }
        }
        else {
            if (receipt === null) {
                let timestamp;
                if (this.bedrock) {
                    const output = await this.getMessageBedrockOutput(resolved);
                    if (output === null) {
                        return interfaces_1.MessageStatus.STATE_ROOT_NOT_PUBLISHED;
                    }
                    // Convert the message to the low level message that was proven.
                    const withdrawal = await this.toLowLevelMessage(resolved);
                    // Attempt to fetch the proven withdrawal.
                    const provenWithdrawal = await this.contracts.l1.OptimismPortal.provenWithdrawals((0, utils_1.hashLowLevelMessage)(withdrawal));
                    // If the withdrawal hash has not been proven on L1,
                    // return `READY_TO_PROVE`
                    if (provenWithdrawal.timestamp.eq(ethers_1.BigNumber.from(0))) {
                        return interfaces_1.MessageStatus.READY_TO_PROVE;
                    }
                    // Set the timestamp to the provenWithdrawal's timestamp
                    timestamp = provenWithdrawal.timestamp.toNumber();
                }
                else {
                    const stateRoot = await this.getMessageStateRoot(resolved);
                    if (stateRoot === null) {
                        return interfaces_1.MessageStatus.STATE_ROOT_NOT_PUBLISHED;
                    }
                    const bn = stateRoot.batch.blockNumber;
                    const block = await this.l1Provider.getBlock(bn);
                    timestamp = block.timestamp;
                }
                const challengePeriod = await this.getChallengePeriodSeconds();
                const latestBlock = await this.l1Provider.getBlock('latest');
                if (timestamp + challengePeriod > latestBlock.timestamp) {
                    return interfaces_1.MessageStatus.IN_CHALLENGE_PERIOD;
                }
                else {
                    return interfaces_1.MessageStatus.READY_FOR_RELAY;
                }
            }
            else {
                if (receipt.receiptStatus === interfaces_1.MessageReceiptStatus.RELAYED_SUCCEEDED) {
                    return interfaces_1.MessageStatus.RELAYED;
                }
                else {
                    return interfaces_1.MessageStatus.READY_FOR_RELAY;
                }
            }
        }
    }
    /**
     * Finds the receipt of the transaction that executed a particular cross chain message.
     *
     * @param message Message to find the receipt of.
     * @returns CrossChainMessage receipt including receipt of the transaction that relayed the
     * given message.
     */
    async getMessageReceipt(message) {
        const resolved = await this.toCrossChainMessage(message);
        // legacy withdrawals relayed prebedrock are v1
        const messageHashV0 = (0, core_utils_1.hashCrossDomainMessagev0)(resolved.target, resolved.sender, resolved.message, resolved.messageNonce);
        // bedrock withdrawals are v1
        // legacy withdrawals relayed postbedrock are v1
        // there is no good way to differentiate between the two types of legacy
        // so what we will check for both
        const messageHashV1 = (0, core_utils_1.hashCrossDomainMessagev1)(resolved.messageNonce, resolved.sender, resolved.target, resolved.value, resolved.minGasLimit, resolved.message);
        // Here we want the messenger that will receive the message, not the one that sent it.
        const messenger = resolved.direction === interfaces_1.MessageDirection.L1_TO_L2
            ? this.contracts.l2.L2CrossDomainMessenger
            : this.contracts.l1.L1CrossDomainMessenger;
        // this is safe because we can guarantee only one of these filters max will return something
        const relayedMessageEvents = [
            ...(await messenger.queryFilter(messenger.filters.RelayedMessage(messageHashV0))),
            ...(await messenger.queryFilter(messenger.filters.RelayedMessage(messageHashV1))),
        ];
        // Great, we found the message. Convert it into a transaction receipt.
        if (relayedMessageEvents.length === 1) {
            return {
                receiptStatus: interfaces_1.MessageReceiptStatus.RELAYED_SUCCEEDED,
                transactionReceipt: await relayedMessageEvents[0].getTransactionReceipt(),
            };
        }
        else if (relayedMessageEvents.length > 1) {
            // Should never happen!
            throw new Error(`multiple successful relays for message`);
        }
        // We didn't find a transaction that relayed the message. We now attempt to find
        // FailedRelayedMessage events instead.
        const failedRelayedMessageEvents = [
            ...(await messenger.queryFilter(messenger.filters.FailedRelayedMessage(messageHashV0))),
            ...(await messenger.queryFilter(messenger.filters.FailedRelayedMessage(messageHashV1))),
        ];
        // A transaction can fail to be relayed multiple times. We'll always return the last
        // transaction that attempted to relay the message.
        // TODO: Is this the best way to handle this?
        if (failedRelayedMessageEvents.length > 0) {
            return {
                receiptStatus: interfaces_1.MessageReceiptStatus.RELAYED_FAILED,
                transactionReceipt: await failedRelayedMessageEvents[failedRelayedMessageEvents.length - 1].getTransactionReceipt(),
            };
        }
        // TODO: If the user doesn't provide enough gas then there's a chance that FailedRelayedMessage
        // will never be triggered. We should probably fix this at the contract level by requiring a
        // minimum amount of input gas and designing the contracts such that the gas will always be
        // enough to trigger the event. However, for now we need a temporary way to find L1 => L2
        // transactions that fail but don't alert us because they didn't provide enough gas.
        // TODO: Talk with the systems and protocol team about coordinating a hard fork that fixes this
        // on both L1 and L2.
        // Just return null if we didn't find a receipt. Slightly nicer than throwing an error.
        return null;
    }
    /**
     * Waits for a message to be executed and returns the receipt of the transaction that executed
     * the given message.
     *
     * @param message Message to wait for.
     * @param opts Options to pass to the waiting function.
     * @param opts.confirmations Number of transaction confirmations to wait for before returning.
     * @param opts.pollIntervalMs Number of milliseconds to wait between polling for the receipt.
     * @param opts.timeoutMs Milliseconds to wait before timing out.
     * @returns CrossChainMessage receipt including receipt of the transaction that relayed the
     * given message.
     */
    async waitForMessageReceipt(message, opts = {}) {
        // Resolving once up-front is slightly more efficient.
        const resolved = await this.toCrossChainMessage(message);
        let totalTimeMs = 0;
        while (totalTimeMs < (opts.timeoutMs || Infinity)) {
            const tick = Date.now();
            const receipt = await this.getMessageReceipt(resolved);
            if (receipt !== null) {
                return receipt;
            }
            else {
                await (0, core_utils_1.sleep)(opts.pollIntervalMs || 4000);
                totalTimeMs += Date.now() - tick;
            }
        }
        throw new Error(`timed out waiting for message receipt`);
    }
    /**
     * Waits until the status of a given message changes to the expected status. Note that if the
     * status of the given message changes to a status that implies the expected status, this will
     * still return. If the status of the message changes to a status that exclues the expected
     * status, this will throw an error.
     *
     * @param message Message to wait for.
     * @param status Expected status of the message.
     * @param opts Options to pass to the waiting function.
     * @param opts.pollIntervalMs Number of milliseconds to wait when polling.
     * @param opts.timeoutMs Milliseconds to wait before timing out.
     */
    async waitForMessageStatus(message, status, opts = {}) {
        // Resolving once up-front is slightly more efficient.
        const resolved = await this.toCrossChainMessage(message);
        let totalTimeMs = 0;
        while (totalTimeMs < (opts.timeoutMs || Infinity)) {
            const tick = Date.now();
            const currentStatus = await this.getMessageStatus(resolved);
            // Handle special cases for L1 to L2 messages.
            if (resolved.direction === interfaces_1.MessageDirection.L1_TO_L2) {
                // If we're at the expected status, we're done.
                if (currentStatus === status) {
                    return;
                }
                if (status === interfaces_1.MessageStatus.UNCONFIRMED_L1_TO_L2_MESSAGE &&
                    currentStatus > status) {
                    // Anything other than UNCONFIRMED_L1_TO_L2_MESSAGE implies that the message was at one
                    // point "unconfirmed", so we can stop waiting.
                    return;
                }
                if (status === interfaces_1.MessageStatus.FAILED_L1_TO_L2_MESSAGE &&
                    currentStatus === interfaces_1.MessageStatus.RELAYED) {
                    throw new Error(`incompatible message status, expected FAILED_L1_TO_L2_MESSAGE got RELAYED`);
                }
                if (status === interfaces_1.MessageStatus.RELAYED &&
                    currentStatus === interfaces_1.MessageStatus.FAILED_L1_TO_L2_MESSAGE) {
                    throw new Error(`incompatible message status, expected RELAYED got FAILED_L1_TO_L2_MESSAGE`);
                }
            }
            // Handle special cases for L2 to L1 messages.
            if (resolved.direction === interfaces_1.MessageDirection.L2_TO_L1) {
                if (currentStatus >= status) {
                    // For L2 to L1 messages, anything after the expected status implies the previous status,
                    // so we can safely return if the current status enum is larger than the expected one.
                    return;
                }
            }
            await (0, core_utils_1.sleep)(opts.pollIntervalMs || 4000);
            totalTimeMs += Date.now() - tick;
        }
        throw new Error(`timed out waiting for message status change`);
    }
    /**
     * Estimates the amount of gas required to fully execute a given message on L2. Only applies to
     * L1 => L2 messages. You would supply this gas limit when sending the message to L2.
     *
     * @param message Message get a gas estimate for.
     * @param opts Options object.
     * @param opts.bufferPercent Percentage of gas to add to the estimate. Defaults to 20.
     * @param opts.from Address to use as the sender.
     * @returns Estimates L2 gas limit.
     */
    async estimateL2MessageGasLimit(message, opts) {
        let resolved;
        let from;
        if (message.messageNonce === undefined) {
            resolved = message;
            from = opts?.from;
        }
        else {
            resolved = await this.toCrossChainMessage(message);
            from = opts?.from || resolved.sender;
        }
        // L2 message gas estimation is only used for L1 => L2 messages.
        if (resolved.direction === interfaces_1.MessageDirection.L2_TO_L1) {
            throw new Error(`cannot estimate gas limit for L2 => L1 message`);
        }
        const estimate = await this.l2Provider.estimateGas({
            from,
            to: resolved.target,
            data: resolved.message,
        });
        // Return the estimate plus a buffer of 20% just in case.
        const bufferPercent = opts?.bufferPercent || 20;
        return estimate.mul(100 + bufferPercent).div(100);
    }
    /**
     * Returns the estimated amount of time before the message can be executed. When this is a
     * message being sent to L1, this will return the estimated time until the message will complete
     * its challenge period. When this is a message being sent to L2, this will return the estimated
     * amount of time until the message will be picked up and executed on L2.
     *
     * @param message Message to estimate the time remaining for.
     * @returns Estimated amount of time remaining (in seconds) before the message can be executed.
     */
    async estimateMessageWaitTimeSeconds(message) {
        const resolved = await this.toCrossChainMessage(message);
        const status = await this.getMessageStatus(resolved);
        if (resolved.direction === interfaces_1.MessageDirection.L1_TO_L2) {
            if (status === interfaces_1.MessageStatus.RELAYED ||
                status === interfaces_1.MessageStatus.FAILED_L1_TO_L2_MESSAGE) {
                // Transactions that are relayed or failed are considered completed, so the wait time is 0.
                return 0;
            }
            else {
                // Otherwise we need to estimate the number of blocks left until the transaction will be
                // considered confirmed by the Layer 2 system. Then we multiply this by the estimated
                // average L1 block time.
                const receipt = await this.l1Provider.getTransactionReceipt(resolved.transactionHash);
                const blocksLeft = Math.max(this.depositConfirmationBlocks - receipt.confirmations, 0);
                return blocksLeft * this.l1BlockTimeSeconds;
            }
        }
        else {
            if (status === interfaces_1.MessageStatus.RELAYED ||
                status === interfaces_1.MessageStatus.READY_FOR_RELAY) {
                // Transactions that are relayed or ready for relay are considered complete.
                return 0;
            }
            else if (status === interfaces_1.MessageStatus.STATE_ROOT_NOT_PUBLISHED) {
                // If the state root hasn't been published yet, just assume it'll be published relatively
                // quickly and return the challenge period for now. In the future we could use more
                // advanced techniques to figure out average time between transaction execution and
                // state root publication.
                return this.getChallengePeriodSeconds();
            }
            else if (status === interfaces_1.MessageStatus.IN_CHALLENGE_PERIOD) {
                // If the message is still within the challenge period, then we need to estimate exactly
                // the amount of time left until the challenge period expires. The challenge period starts
                // when the state root is published.
                const stateRoot = await this.getMessageStateRoot(resolved);
                const challengePeriod = await this.getChallengePeriodSeconds();
                const targetBlock = await this.l1Provider.getBlock(stateRoot.batch.blockNumber);
                const latestBlock = await this.l1Provider.getBlock('latest');
                return Math.max(challengePeriod - (latestBlock.timestamp - targetBlock.timestamp), 0);
            }
            else {
                // Should not happen
                throw new Error(`unexpected message status`);
            }
        }
    }
    /**
     * Queries the current challenge period in seconds from the StateCommitmentChain.
     *
     * @returns Current challenge period in seconds.
     */
    async getChallengePeriodSeconds() {
        if (!this.bedrock) {
            return (await this.contracts.l1.StateCommitmentChain.FRAUD_PROOF_WINDOW()).toNumber();
        }
        const oracleVersion = await this.contracts.l1.L2OutputOracle.version();
        const challengePeriod = oracleVersion === '1.0.0'
            ? // The ABI in the SDK does not contain FINALIZATION_PERIOD_SECONDS
                // in OptimismPortal, so making an explicit call instead.
                ethers_1.BigNumber.from(await this.contracts.l1.OptimismPortal.provider.call({
                    to: this.contracts.l1.OptimismPortal.address,
                    data: '0xf4daa291', // FINALIZATION_PERIOD_SECONDS
                }))
            : await this.contracts.l1.L2OutputOracle.FINALIZATION_PERIOD_SECONDS();
        return challengePeriod.toNumber();
    }
    /**
     * Queries the OptimismPortal contract's `provenWithdrawals` mapping
     * for a ProvenWithdrawal that matches the passed withdrawalHash
     *
     * @bedrock
     * Note: This function is bedrock-specific.
     *
     * @returns A ProvenWithdrawal object
     */
    async getProvenWithdrawal(withdrawalHash) {
        if (!this.bedrock) {
            throw new Error('message proving only applies after the bedrock upgrade');
        }
        return this.contracts.l1.OptimismPortal.provenWithdrawals(withdrawalHash);
    }
    /**
     * Returns the Bedrock output root that corresponds to the given message.
     *
     * @param message Message to get the Bedrock output root for.
     * @returns Bedrock output root.
     */
    async getMessageBedrockOutput(message) {
        const resolved = await this.toCrossChainMessage(message);
        // Outputs are only a thing for L2 to L1 messages.
        if (resolved.direction === interfaces_1.MessageDirection.L1_TO_L2) {
            throw new Error(`cannot get a state root for an L1 to L2 message`);
        }
        // Try to find the output index that corresponds to the block number attached to the message.
        // We'll explicitly handle "cannot get output" errors as a null return value, but anything else
        // needs to get thrown. Might need to revisit this in the future to be a little more robust
        // when connected to RPCs that don't return nice error messages.
        let l2OutputIndex;
        try {
            l2OutputIndex =
                await this.contracts.l1.L2OutputOracle.getL2OutputIndexAfter(resolved.blockNumber);
        }
        catch (err) {
            if (err.message.includes('L2OutputOracle: cannot get output')) {
                return null;
            }
            else {
                throw err;
            }
        }
        // Now pull the proposal out given the output index. Should always work as long as the above
        // codepath completed successfully.
        const proposal = await this.contracts.l1.L2OutputOracle.getL2Output(l2OutputIndex);
        // Format everything and return it nicely.
        return {
            outputRoot: proposal.outputRoot,
            l1Timestamp: proposal.timestamp.toNumber(),
            l2BlockNumber: proposal.l2BlockNumber.toNumber(),
            l2OutputIndex: l2OutputIndex.toNumber(),
        };
    }
    /**
     * Returns the state root that corresponds to a given message. This is the state root for the
     * block in which the transaction was included, as published to the StateCommitmentChain. If the
     * state root for the given message has not been published yet, this function returns null.
     *
     * @param message Message to find a state root for.
     * @returns State root for the block in which the message was created.
     */
    async getMessageStateRoot(message) {
        const resolved = await this.toCrossChainMessage(message);
        // State roots are only a thing for L2 to L1 messages.
        if (resolved.direction === interfaces_1.MessageDirection.L1_TO_L2) {
            throw new Error(`cannot get a state root for an L1 to L2 message`);
        }
        // We need the block number of the transaction that triggered the message so we can look up the
        // state root batch that corresponds to that block number.
        const messageTxReceipt = await this.l2Provider.getTransactionReceipt(resolved.transactionHash);
        // Every block has exactly one transaction in it. Since there's a genesis block, the
        // transaction index will always be one less than the block number.
        const messageTxIndex = messageTxReceipt.blockNumber - 1;
        // Pull down the state root batch, we'll try to pick out the specific state root that
        // corresponds to our message.
        const stateRootBatch = await this.getStateRootBatchByTransactionIndex(messageTxIndex);
        // No state root batch, no state root.
        if (stateRootBatch === null) {
            return null;
        }
        // We have a state root batch, now we need to find the specific state root for our transaction.
        // First we need to figure out the index of the state root within the batch we found. This is
        // going to be the original transaction index offset by the total number of previous state
        // roots.
        const indexInBatch = messageTxIndex - stateRootBatch.header.prevTotalElements.toNumber();
        // Just a sanity check.
        if (stateRootBatch.stateRoots.length <= indexInBatch) {
            // Should never happen!
            throw new Error(`state root does not exist in batch`);
        }
        return {
            stateRoot: stateRootBatch.stateRoots[indexInBatch],
            stateRootIndexInBatch: indexInBatch,
            batch: stateRootBatch,
        };
    }
    /**
     * Returns the StateBatchAppended event that was emitted when the batch with a given index was
     * created. Returns null if no such event exists (the batch has not been submitted).
     *
     * @param batchIndex Index of the batch to find an event for.
     * @returns StateBatchAppended event for the batch, or null if no such batch exists.
     */
    async getStateBatchAppendedEventByBatchIndex(batchIndex) {
        const events = await this.contracts.l1.StateCommitmentChain.queryFilter(this.contracts.l1.StateCommitmentChain.filters.StateBatchAppended(batchIndex));
        if (events.length === 0) {
            return null;
        }
        else if (events.length > 1) {
            // Should never happen!
            throw new Error(`found more than one StateBatchAppended event`);
        }
        else {
            return events[0];
        }
    }
    /**
     * Returns the StateBatchAppended event for the batch that includes the transaction with the
     * given index. Returns null if no such event exists.
     *
     * @param transactionIndex Index of the L2 transaction to find an event for.
     * @returns StateBatchAppended event for the batch that includes the given transaction by index.
     */
    async getStateBatchAppendedEventByTransactionIndex(transactionIndex) {
        const isEventHi = (event, index) => {
            const prevTotalElements = event.args._prevTotalElements.toNumber();
            return index < prevTotalElements;
        };
        const isEventLo = (event, index) => {
            const prevTotalElements = event.args._prevTotalElements.toNumber();
            const batchSize = event.args._batchSize.toNumber();
            return index >= prevTotalElements + batchSize;
        };
        const totalBatches = await this.contracts.l1.StateCommitmentChain.getTotalBatches();
        if (totalBatches.eq(0)) {
            return null;
        }
        let lowerBound = 0;
        let upperBound = totalBatches.toNumber() - 1;
        let batchEvent = await this.getStateBatchAppendedEventByBatchIndex(upperBound);
        // Only happens when no batches have been submitted yet.
        if (batchEvent === null) {
            return null;
        }
        if (isEventLo(batchEvent, transactionIndex)) {
            // Upper bound is too low, means this transaction doesn't have a corresponding state batch yet.
            return null;
        }
        else if (!isEventHi(batchEvent, transactionIndex)) {
            // Upper bound is not too low and also not too high. This means the upper bound event is the
            // one we're looking for! Return it.
            return batchEvent;
        }
        // Binary search to find the right event. The above checks will guarantee that the event does
        // exist and that we'll find it during this search.
        while (lowerBound < upperBound) {
            const middleOfBounds = Math.floor((lowerBound + upperBound) / 2);
            batchEvent = await this.getStateBatchAppendedEventByBatchIndex(middleOfBounds);
            if (isEventHi(batchEvent, transactionIndex)) {
                upperBound = middleOfBounds;
            }
            else if (isEventLo(batchEvent, transactionIndex)) {
                lowerBound = middleOfBounds;
            }
            else {
                break;
            }
        }
        return batchEvent;
    }
    /**
     * Returns information about the state root batch that included the state root for the given
     * transaction by index. Returns null if no such state root has been published yet.
     *
     * @param transactionIndex Index of the L2 transaction to find a state root batch for.
     * @returns State root batch for the given transaction index, or null if none exists yet.
     */
    async getStateRootBatchByTransactionIndex(transactionIndex) {
        const stateBatchAppendedEvent = await this.getStateBatchAppendedEventByTransactionIndex(transactionIndex);
        if (stateBatchAppendedEvent === null) {
            return null;
        }
        const stateBatchTransaction = await stateBatchAppendedEvent.getTransaction();
        const [stateRoots] = this.contracts.l1.StateCommitmentChain.interface.decodeFunctionData('appendStateBatch', stateBatchTransaction.data);
        return {
            blockNumber: stateBatchAppendedEvent.blockNumber,
            stateRoots,
            header: {
                batchIndex: stateBatchAppendedEvent.args._batchIndex,
                batchRoot: stateBatchAppendedEvent.args._batchRoot,
                batchSize: stateBatchAppendedEvent.args._batchSize,
                prevTotalElements: stateBatchAppendedEvent.args._prevTotalElements,
                extraData: stateBatchAppendedEvent.args._extraData,
            },
        };
    }
    /**
     * Generates the proof required to finalize an L2 to L1 message.
     *
     * @param message Message to generate a proof for.
     * @returns Proof that can be used to finalize the message.
     */
    async getMessageProof(message) {
        const resolved = await this.toCrossChainMessage(message);
        if (resolved.direction === interfaces_1.MessageDirection.L1_TO_L2) {
            throw new Error(`can only generate proofs for L2 to L1 messages`);
        }
        const stateRoot = await this.getMessageStateRoot(resolved);
        if (stateRoot === null) {
            throw new Error(`state root for message not yet published`);
        }
        // We need to calculate the specific storage slot that demonstrates that this message was
        // actually included in the L2 chain. The following calculation is based on the fact that
        // messages are stored in the following mapping on L2:
        // https://github.com/ethereum-optimism/optimism/blob/c84d3450225306abbb39b4e7d6d82424341df2be/packages/contracts/contracts/L2/predeploys/OVM_L2ToL1MessagePasser.sol#L23
        // You can read more about how Solidity storage slots are computed for mappings here:
        // https://docs.soliditylang.org/en/v0.8.4/internals/layout_in_storage.html#mappings-and-dynamic-arrays
        const messageSlot = ethers_1.ethers.utils.keccak256(ethers_1.ethers.utils.keccak256((0, core_utils_1.encodeCrossDomainMessageV0)(resolved.target, resolved.sender, resolved.message, resolved.messageNonce) + (0, core_utils_1.remove0x)(this.contracts.l2.L2CrossDomainMessenger.address)) + '00'.repeat(32));
        const stateTrieProof = await (0, utils_1.makeStateTrieProof)(this.l2Provider, resolved.blockNumber, this.contracts.l2.OVM_L2ToL1MessagePasser.address, messageSlot);
        return {
            stateRoot: stateRoot.stateRoot,
            stateRootBatchHeader: stateRoot.batch.header,
            stateRootProof: {
                index: stateRoot.stateRootIndexInBatch,
                siblings: (0, utils_1.makeMerkleTreeProof)(stateRoot.batch.stateRoots, stateRoot.stateRootIndexInBatch),
            },
            stateTrieWitness: (0, core_utils_1.toHexString)(rlp.encode(stateTrieProof.accountProof)),
            storageTrieWitness: (0, core_utils_1.toHexString)(rlp.encode(stateTrieProof.storageProof)),
        };
    }
    /**
     * Generates the bedrock proof required to finalize an L2 to L1 message.
     *
     * @param message Message to generate a proof for.
     * @returns Proof that can be used to finalize the message.
     */
    async getBedrockMessageProof(message) {
        const resolved = await this.toCrossChainMessage(message);
        if (resolved.direction === interfaces_1.MessageDirection.L1_TO_L2) {
            throw new Error(`can only generate proofs for L2 to L1 messages`);
        }
        const output = await this.getMessageBedrockOutput(resolved);
        if (output === null) {
            throw new Error(`state root for message not yet published`);
        }
        const withdrawal = await this.toLowLevelMessage(resolved);
        const hash = (0, utils_1.hashLowLevelMessage)(withdrawal);
        const messageSlot = (0, utils_1.hashMessageHash)(hash);
        const stateTrieProof = await (0, utils_1.makeStateTrieProof)(this.l2Provider, output.l2BlockNumber, this.contracts.l2.BedrockMessagePasser.address, messageSlot);
        const block = await this.l2Provider.send('eth_getBlockByNumber', [
            (0, core_utils_1.toRpcHexString)(output.l2BlockNumber),
            false,
        ]);
        return {
            outputRootProof: {
                version: ethers_1.ethers.constants.HashZero,
                stateRoot: block.stateRoot,
                messagePasserStorageRoot: stateTrieProof.storageRoot,
                latestBlockhash: block.hash,
            },
            withdrawalProof: stateTrieProof.storageProof,
            l2OutputIndex: output.l2OutputIndex,
        };
    }
    /**
     * Sends a given cross chain message. Where the message is sent depends on the direction attached
     * to the message itself.
     *
     * @param message Cross chain message to send.
     * @param opts Additional options.
     * @param opts.signer Optional signer to use to send the transaction.
     * @param opts.l2GasLimit Optional gas limit to use for the transaction on L2.
     * @param opts.overrides Optional transaction overrides.
     * @returns Transaction response for the message sending transaction.
     */
    async sendMessage(message, opts) {
        const tx = await this.populateTransaction.sendMessage(message, opts);
        if (message.direction === interfaces_1.MessageDirection.L1_TO_L2) {
            return (opts?.signer || this.l1Signer).sendTransaction(tx);
        }
        else {
            return (opts?.signer || this.l2Signer).sendTransaction(tx);
        }
    }
    /**
     * Resends a given cross chain message with a different gas limit. Only applies to L1 to L2
     * messages. If provided an L2 to L1 message, this function will throw an error.
     *
     * @param message Cross chain message to resend.
     * @param messageGasLimit New gas limit to use for the message.
     * @param opts Additional options.
     * @param opts.signer Optional signer to use to send the transaction.
     * @param opts.overrides Optional transaction overrides.
     * @returns Transaction response for the message resending transaction.
     */
    async resendMessage(message, messageGasLimit, opts) {
        return (opts?.signer || this.l1Signer).sendTransaction(await this.populateTransaction.resendMessage(message, messageGasLimit, opts));
    }
    /**
     * Proves a cross chain message that was sent from L2 to L1. Only applicable for L2 to L1
     * messages.
     *
     * @param message Message to finalize.
     * @param opts Additional options.
     * @param opts.signer Optional signer to use to send the transaction.
     * @param opts.overrides Optional transaction overrides.
     * @returns Transaction response for the finalization transaction.
     */
    async proveMessage(message, opts) {
        const tx = await this.populateTransaction.proveMessage(message, opts);
        return (opts?.signer || this.l1Signer).sendTransaction(tx);
    }
    /**
     * Finalizes a cross chain message that was sent from L2 to L1. Only applicable for L2 to L1
     * messages. Will throw an error if the message has not completed its challenge period yet.
     *
     * @param message Message to finalize.
     * @param opts Additional options.
     * @param opts.signer Optional signer to use to send the transaction.
     * @param opts.overrides Optional transaction overrides.
     * @returns Transaction response for the finalization transaction.
     */
    async finalizeMessage(message, opts) {
        return (opts?.signer || this.l1Signer).sendTransaction(await this.populateTransaction.finalizeMessage(message, opts));
    }
    /**
     * Deposits some ETH into the L2 chain.
     *
     * @param amount Amount of ETH to deposit (in wei).
     * @param opts Additional options.
     * @param opts.signer Optional signer to use to send the transaction.
     * @param opts.recipient Optional address to receive the funds on L2. Defaults to sender.
     * @param opts.l2GasLimit Optional gas limit to use for the transaction on L2.
     * @param opts.overrides Optional transaction overrides.
     * @returns Transaction response for the deposit transaction.
     */
    async depositETH(amount, opts) {
        return (opts?.signer || this.l1Signer).sendTransaction(await this.populateTransaction.depositETH(amount, opts));
    }
    /**
     * Withdraws some ETH back to the L1 chain.
     *
     * @param amount Amount of ETH to withdraw.
     * @param opts Additional options.
     * @param opts.signer Optional signer to use to send the transaction.
     * @param opts.recipient Optional address to receive the funds on L1. Defaults to sender.
     * @param opts.overrides Optional transaction overrides.
     * @returns Transaction response for the withdraw transaction.
     */
    async withdrawETH(amount, opts) {
        return (opts?.signer || this.l2Signer).sendTransaction(await this.populateTransaction.withdrawETH(amount, opts));
    }
    /**
     * Queries the account's approval amount for a given L1 token.
     *
     * @param l1Token The L1 token address.
     * @param l2Token The L2 token address.
     * @param opts Additional options.
     * @param opts.signer Optional signer to get the approval for.
     * @returns Amount of tokens approved for deposits from the account.
     */
    async approval(l1Token, l2Token, opts) {
        const bridge = await this.getBridgeForTokenPair(l1Token, l2Token);
        return bridge.approval(l1Token, l2Token, opts?.signer || this.l1Signer);
    }
    /**
     * Approves a deposit into the L2 chain.
     *
     * @param l1Token The L1 token address.
     * @param l2Token The L2 token address.
     * @param amount Amount of the token to approve.
     * @param opts Additional options.
     * @param opts.signer Optional signer to use to send the transaction.
     * @param opts.overrides Optional transaction overrides.
     * @returns Transaction response for the approval transaction.
     */
    async approveERC20(l1Token, l2Token, amount, opts) {
        return (opts?.signer || this.l1Signer).sendTransaction(await this.populateTransaction.approveERC20(l1Token, l2Token, amount, opts));
    }
    /**
     * Deposits some ERC20 tokens into the L2 chain.
     *
     * @param l1Token Address of the L1 token.
     * @param l2Token Address of the L2 token.
     * @param amount Amount to deposit.
     * @param opts Additional options.
     * @param opts.signer Optional signer to use to send the transaction.
     * @param opts.recipient Optional address to receive the funds on L2. Defaults to sender.
     * @param opts.l2GasLimit Optional gas limit to use for the transaction on L2.
     * @param opts.overrides Optional transaction overrides.
     * @returns Transaction response for the deposit transaction.
     */
    async depositERC20(l1Token, l2Token, amount, opts) {
        return (opts?.signer || this.l1Signer).sendTransaction(await this.populateTransaction.depositERC20(l1Token, l2Token, amount, opts));
    }
    /**
     * Withdraws some ERC20 tokens back to the L1 chain.
     *
     * @param l1Token Address of the L1 token.
     * @param l2Token Address of the L2 token.
     * @param amount Amount to withdraw.
     * @param opts Additional options.
     * @param opts.signer Optional signer to use to send the transaction.
     * @param opts.recipient Optional address to receive the funds on L1. Defaults to sender.
     * @param opts.overrides Optional transaction overrides.
     * @returns Transaction response for the withdraw transaction.
     */
    async withdrawERC20(l1Token, l2Token, amount, opts) {
        return (opts?.signer || this.l2Signer).sendTransaction(await this.populateTransaction.withdrawERC20(l1Token, l2Token, amount, opts));
    }
}
exports.CrossChainMessenger = CrossChainMessenger;
