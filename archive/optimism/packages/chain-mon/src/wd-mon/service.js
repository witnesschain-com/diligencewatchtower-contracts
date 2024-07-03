"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WithdrawalMonitor = void 0;
const common_ts_1 = require("@eth-optimism/common-ts");
const sdk_1 = require("@eth-optimism/sdk");
const core_utils_1 = require("@eth-optimism/core-utils");
const dateformat_1 = __importDefault(require("dateformat"));
const package_json_1 = require("../../package.json");
class WithdrawalMonitor extends common_ts_1.BaseServiceV2 {
    constructor(options) {
        super({
            version: package_json_1.version,
            name: 'two-step-monitor',
            loop: true,
            options: {
                loopIntervalMs: 1000,
                ...options,
            },
            optionsSpec: {
                l1RpcProvider: {
                    validator: common_ts_1.validators.provider,
                    desc: 'Provider for interacting with L1',
                },
                l2RpcProvider: {
                    validator: common_ts_1.validators.provider,
                    desc: 'Provider for interacting with L2',
                },
                startBlockNumber: {
                    validator: common_ts_1.validators.num,
                    default: -1,
                    desc: 'L1 block number to start checking from',
                    public: true,
                },
                sleepTimeMs: {
                    validator: common_ts_1.validators.num,
                    default: 15000,
                    desc: 'Time in ms to sleep when waiting for a node',
                    public: true,
                },
            },
            metricsSpec: {
                withdrawalsValidated: {
                    type: common_ts_1.Gauge,
                    desc: 'Latest L1 Block (checked and known)',
                    labels: ['type'],
                },
                isDetectingForgeries: {
                    type: common_ts_1.Gauge,
                    desc: '0 if state is ok. 1 or more if forged withdrawals are detected.',
                },
                nodeConnectionFailures: {
                    type: common_ts_1.Gauge,
                    desc: 'Number of times node connection has failed',
                    labels: ['layer', 'section'],
                },
            },
        });
    }
    async init() {
        // Connect to L1.
        await (0, common_ts_1.waitForProvider)(this.options.l1RpcProvider, {
            logger: this.logger,
            name: 'L1',
        });
        // Connect to L2.
        await (0, common_ts_1.waitForProvider)(this.options.l2RpcProvider, {
            logger: this.logger,
            name: 'L2',
        });
        this.state.messenger = new sdk_1.CrossChainMessenger({
            l1SignerOrProvider: this.options.l1RpcProvider,
            l2SignerOrProvider: this.options.l2RpcProvider,
            l1ChainId: await (0, core_utils_1.getChainId)(this.options.l1RpcProvider),
            l2ChainId: await (0, core_utils_1.getChainId)(this.options.l2RpcProvider),
        });
        // Not detected by default.
        this.state.forgeryDetected = false;
        // For now we'll just start take it from the env or the tip of the chain
        if (this.options.startBlockNumber === -1) {
            this.state.highestUncheckedBlockNumber =
                await this.options.l1RpcProvider.getBlockNumber();
        }
        else {
            this.state.highestUncheckedBlockNumber = this.options.startBlockNumber;
        }
        this.logger.info(`starting L1 block height`, {
            startBlockNumber: this.state.highestUncheckedBlockNumber,
        });
    }
    // K8s healthcheck
    async routes(router) {
        router.get('/healthz', async (req, res) => {
            return res.status(200).json({
                ok: !this.state.forgeryDetected,
            });
        });
    }
    async main() {
        // Get current block number
        let latestL1BlockNumber;
        try {
            latestL1BlockNumber = await this.options.l1RpcProvider.getBlockNumber();
        }
        catch (err) {
            this.logger.error(`got error when connecting to node`, {
                error: err,
                node: 'l1',
                section: 'getBlockNumber',
            });
            this.metrics.nodeConnectionFailures.inc({
                layer: 'l1',
                section: 'getBlockNumber',
            });
            await (0, core_utils_1.sleep)(this.options.sleepTimeMs);
            return;
        }
        // See if we have a new unchecked block
        if (latestL1BlockNumber <= this.state.highestUncheckedBlockNumber) {
            // The RPC provider is behind us, wait a bit
            await (0, core_utils_1.sleep)(this.options.sleepTimeMs);
            return;
        }
        this.logger.info(`checking recent blocks`, {
            fromBlockNumber: this.state.highestUncheckedBlockNumber,
            toBlockNumber: latestL1BlockNumber,
        });
        // Perform the check
        let proofEvents;
        try {
            // The query includes events in the blockNumbers given as the last two arguments
            proofEvents =
                await this.state.messenger.contracts.l1.OptimismPortal.queryFilter(this.state.messenger.contracts.l1.OptimismPortal.filters.WithdrawalProven(), this.state.highestUncheckedBlockNumber, latestL1BlockNumber);
        }
        catch (err) {
            this.logger.error(`got error when connecting to node`, {
                error: err,
                node: 'l1',
                section: 'querying for WithdrawalProven events',
            });
            this.metrics.nodeConnectionFailures.inc({
                layer: 'l1',
                section: 'querying for WithdrawalProven events',
            });
            // connection error, wait then restart
            await (0, core_utils_1.sleep)(this.options.sleepTimeMs);
            return;
        }
        for (const proofEvent of proofEvents) {
            const exists = await this.state.messenger.contracts.l2.BedrockMessagePasser.sentMessages(proofEvent.args.withdrawalHash);
            const block = await proofEvent.getBlock();
            const now = new Date(block.timestamp * 1000);
            const dateString = (0, dateformat_1.default)(now, 'mmmm dS, yyyy, h:MM:ss TT', true // use UTC time
            );
            const provenAt = `${dateString} UTC`;
            if (exists) {
                this.metrics.withdrawalsValidated.inc();
                this.logger.info(`valid withdrawal`, {
                    withdrawalHash: proofEvent.args.withdrawalHash,
                    provenAt,
                });
            }
            else {
                this.logger.error(`withdrawalHash not seen on L2`, {
                    withdrawalHash: proofEvent.args.withdrawalHash,
                    provenAt,
                });
                this.state.forgeryDetected = true;
                this.metrics.isDetectingForgeries.set(1);
                return;
            }
        }
        this.state.highestUncheckedBlockNumber = latestL1BlockNumber + 1;
        // If we got through the above without throwing an error, we should be fine to reset.
        this.state.forgeryDetected = false;
        this.metrics.isDetectingForgeries.set(0);
    }
}
exports.WithdrawalMonitor = WithdrawalMonitor;
if (require.main === module) {
    const service = new WithdrawalMonitor();
    service.run();
}
