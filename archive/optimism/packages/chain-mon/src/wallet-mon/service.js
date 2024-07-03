"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletMonService = void 0;
const common_ts_1 = require("@eth-optimism/common-ts");
const core_utils_1 = require("@eth-optimism/core-utils");
const mainnet_json_1 = __importDefault(require("@eth-optimism/contracts-bedrock/deploy-config/mainnet.json"));
const goerli_json_1 = __importDefault(require("@eth-optimism/contracts-bedrock/deploy-config/goerli.json"));
const L2OutputOracleProxy_json_1 = __importDefault(require("@eth-optimism/contracts-bedrock/deployments/mainnet/L2OutputOracleProxy.json"));
const L2OutputOracleProxy_json_2 = __importDefault(require("@eth-optimism/contracts-bedrock/deployments/goerli/L2OutputOracleProxy.json"));
const package_json_1 = require("../../package.json");
const networks = {
    1: {
        name: 'mainnet',
        l1StartingBlockTag: mainnet_json_1.default.l1StartingBlockTag,
        accounts: [
            {
                label: 'Proposer',
                wallet: mainnet_json_1.default.l2OutputOracleProposer,
                target: L2OutputOracleProxy_json_1.default.address,
            },
            {
                label: 'Batcher',
                wallet: mainnet_json_1.default.batchSenderAddress,
                target: mainnet_json_1.default.batchInboxAddress,
            },
        ],
    },
    10: {
        name: 'goerli',
        l1StartingBlockTag: goerli_json_1.default.l1StartingBlockTag,
        accounts: [
            {
                label: 'Proposer',
                wallet: goerli_json_1.default.l2OutputOracleProposer,
                target: L2OutputOracleProxy_json_2.default.address,
            },
            {
                label: 'Batcher',
                wallet: goerli_json_1.default.batchSenderAddress,
                target: goerli_json_1.default.batchInboxAddress,
            },
        ],
    },
};
class WalletMonService extends common_ts_1.BaseServiceV2 {
    constructor(options) {
        super({
            version: package_json_1.version,
            name: 'wallet-mon',
            loop: true,
            options: {
                loopIntervalMs: 1000,
                ...options,
            },
            optionsSpec: {
                rpc: {
                    validator: common_ts_1.validators.provider,
                    desc: 'Provider for network to monitor balances on',
                },
                startBlockNumber: {
                    validator: common_ts_1.validators.num,
                    default: -1,
                    desc: 'L1 block number to start checking from',
                    public: true,
                },
            },
            metricsSpec: {
                validatedCalls: {
                    type: common_ts_1.Gauge,
                    desc: 'Transactions from the account checked',
                    labels: ['wallet', 'target', 'nickname'],
                },
                unexpectedCalls: {
                    type: common_ts_1.Counter,
                    desc: 'Number of unexpected wallets',
                    labels: ['wallet', 'target', 'nickname'],
                },
                unexpectedRpcErrors: {
                    type: common_ts_1.Counter,
                    desc: 'Number of unexpected RPC errors',
                    labels: ['section', 'name'],
                },
            },
        });
    }
    async init() {
        // Connect to L1.
        await (0, common_ts_1.waitForProvider)(this.options.rpc, {
            logger: this.logger,
            name: 'L1',
        });
        this.state.chainId = await (0, core_utils_1.getChainId)(this.options.rpc);
        const l1StartingBlockTag = networks[this.state.chainId].l1StartingBlockTag;
        if (this.options.startBlockNumber === -1) {
            const block = await this.options.rpc.getBlock(l1StartingBlockTag);
            this.state.highestUncheckedBlockNumber = block.number;
        }
        else {
            this.state.highestUncheckedBlockNumber = this.options.startBlockNumber;
        }
    }
    async main() {
        if ((await this.options.rpc.getBlockNumber()) <
            this.state.highestUncheckedBlockNumber) {
            this.logger.info('Waiting for new blocks');
            return;
        }
        const network = networks[this.state.chainId];
        const accounts = network.accounts;
        const block = await this.options.rpc.getBlock(this.state.highestUncheckedBlockNumber);
        this.logger.info('Checking block', {
            number: block.number,
        });
        const transactions = [];
        for (const txHash of block.transactions) {
            const t = await this.options.rpc.getTransaction(txHash);
            transactions.push(t);
        }
        for (const transaction of transactions) {
            for (const account of accounts) {
                if ((0, core_utils_1.compareAddrs)(account.wallet, transaction.from)) {
                    if ((0, core_utils_1.compareAddrs)(account.target, transaction.to)) {
                        this.metrics.validatedCalls.inc({
                            nickname: account.label,
                            wallet: account.address,
                            target: account.target,
                        });
                        this.logger.info('validated call', {
                            nickname: account.label,
                            wallet: account.address,
                            target: account.target,
                        });
                    }
                    else {
                        this.metrics.unexpectedCalls.inc({
                            nickname: account.label,
                            wallet: account.address,
                            target: transaction.to,
                        });
                        this.logger.error('Unexpected call detected', {
                            nickname: account.label,
                            address: account.address,
                            target: transaction.to,
                        });
                    }
                }
            }
        }
        this.logger.info('Checked block', {
            number: this.state.highestUncheckedBlockNumber,
        });
        this.state.highestUncheckedBlockNumber++;
    }
}
exports.WalletMonService = WalletMonService;
if (require.main === module) {
    const service = new WalletMonService();
    service.run();
}
