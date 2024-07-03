"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FaultDetector = void 0;
const common_ts_1 = require("@eth-optimism/common-ts");
const core_utils_1 = require("@eth-optimism/core-utils");
const dotenv_1 = require("dotenv");
const sdk_1 = require("@eth-optimism/sdk");
const ethers_1 = require("ethers");
const dateformat_1 = __importDefault(require("dateformat"));
const package_json_1 = require("../package.json");
const helpers_1 = require("./helpers");
class FaultDetector extends common_ts_1.BaseServiceV2 {
    constructor(options) {
        super({
            version: package_json_1.version,
            name: 'fault-detector',
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
                startBatchIndex: {
                    validator: common_ts_1.validators.num,
                    default: -1,
                    desc: 'The L2 height to start from',
                    public: true,
                },
                optimismPortalAddress: {
                    validator: common_ts_1.validators.str,
                    default: ethers_1.ethers.constants.AddressZero,
                    desc: '[Custom OP Chains] Deployed OptimismPortal contract address. Used to retrieve necessary info for ouput verification ',
                    public: true,
                },
            },
            metricsSpec: {
                highestBatchIndex: {
                    type: common_ts_1.Gauge,
                    desc: 'Highest batch indices (checked and known)',
                    labels: ['type'],
                },
                isCurrentlyMismatched: {
                    type: common_ts_1.Gauge,
                    desc: '0 if state is ok, 1 if state is mismatched',
                },
                nodeConnectionFailures: {
                    type: common_ts_1.Gauge,
                    desc: 'Number of times node connection has failed',
                    labels: ['layer', 'section'],
                },
            },
        });
    }
    /**
     * Provides the required set of addresses used by the fault detector. For recognized op-chains, this
     * will fallback to the pre-defined set of addresses from options, otherwise aborting if unset.
     *
     * Required Contracts
     * - OptimismPortal (used to also fetch L2OutputOracle address variable). This is the preferred address
     * since in early versions of bedrock, OptimismPortal holds the FINALIZATION_WINDOW variable instead of L2OutputOracle.
     * The retrieved L2OutputOracle address from OptimismPortal is used to query for output roots.
     *
     * @param l2ChainId op chain id
     * @returns OEL1ContractsLike set of L1 contracts with only the required addresses set
     */
    async getOEL1Contracts(l2ChainId) {
        // CrossChainMessenger requires all address to be defined. Default to `AddressZero` to ignore unused contracts
        let contracts = {
            OptimismPortal: ethers_1.ethers.constants.AddressZero,
            L2OutputOracle: ethers_1.ethers.constants.AddressZero,
            // Unused contracts
            AddressManager: ethers_1.ethers.constants.AddressZero,
            BondManager: ethers_1.ethers.constants.AddressZero,
            CanonicalTransactionChain: ethers_1.ethers.constants.AddressZero,
            L1CrossDomainMessenger: ethers_1.ethers.constants.AddressZero,
            L1StandardBridge: ethers_1.ethers.constants.AddressZero,
            StateCommitmentChain: ethers_1.ethers.constants.AddressZero,
        };
        const knownChainId = sdk_1.L2ChainID[l2ChainId] !== undefined;
        if (knownChainId) {
            this.logger.info(`Recognized L2 chain id ${sdk_1.L2ChainID[l2ChainId]}`);
            // fallback to the predefined defaults for this chain id
            contracts = sdk_1.CONTRACT_ADDRESSES[l2ChainId].l1;
        }
        this.logger.info('checking contract address options...');
        const portalAddress = this.options.optimismPortalAddress;
        if (!knownChainId && portalAddress === ethers_1.ethers.constants.AddressZero) {
            this.logger.error('OptimismPortal contract unspecified');
            throw new Error('--optimismportalcontractaddress needs to set for custom op chains');
        }
        if (portalAddress !== ethers_1.ethers.constants.AddressZero) {
            this.logger.info('set OptimismPortal contract override');
            contracts.OptimismPortal = portalAddress;
            this.logger.info('fetching L2OutputOracle contract from OptimismPortal');
            const opts = {
                portalAddress,
                signerOrProvider: this.options.l1RpcProvider,
            };
            const portalContract = (0, sdk_1.getOEContract)('OptimismPortal', l2ChainId, opts);
            contracts.L2OutputOracle = await portalContract.L2_ORACLE();
        }
        // ... for a known chain ids without an override, the L2OutputOracle will already
        // be set via the hardcoded default
        return contracts;
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
        const l1ChainId = await (0, core_utils_1.getChainId)(this.options.l1RpcProvider);
        const l2ChainId = await (0, core_utils_1.getChainId)(this.options.l2RpcProvider);
        this.state.messenger = new sdk_1.CrossChainMessenger({
            l1SignerOrProvider: this.options.l1RpcProvider,
            l2SignerOrProvider: this.options.l2RpcProvider,
            l1ChainId,
            l2ChainId,
            bedrock: true,
            contracts: { l1: await this.getOEL1Contracts(l2ChainId) },
        });
        // Not diverged by default.
        this.state.diverged = false;
        // We use this a lot, a bit cleaner to pull out to the top level of the state object.
        this.state.faultProofWindow =
            await this.state.messenger.getChallengePeriodSeconds();
        this.logger.info(`fault proof window is ${this.state.faultProofWindow} seconds`);
        this.state.outputOracle = this.state.messenger.contracts.l1.L2OutputOracle;
        // Figure out where to start syncing from.
        if (this.options.startBatchIndex === -1) {
            this.logger.info('finding appropriate starting unfinalized batch');
            const firstUnfinalized = await (0, helpers_1.findFirstUnfinalizedStateBatchIndex)(this.state.outputOracle, this.state.faultProofWindow, this.logger);
            // We may not have an unfinalized batches in the case where no batches have been submitted
            // for the entire duration of the FAULTPROOFWINDOW. We generally do not expect this to happen on mainnet,
            // but it happens often on testnets because the FAULTPROOFWINDOW is very short.
            if (firstUnfinalized === undefined) {
                this.logger.info('no unfinalized batches found. skipping all batches.');
                const totalBatches = await this.state.outputOracle.nextOutputIndex();
                this.state.currentBatchIndex = totalBatches.toNumber() - 1;
            }
            else {
                this.state.currentBatchIndex = firstUnfinalized;
            }
        }
        else {
            this.state.currentBatchIndex = this.options.startBatchIndex;
        }
        this.logger.info('starting batch', {
            batchIndex: this.state.currentBatchIndex,
        });
        // Set the initial metrics.
        this.metrics.isCurrentlyMismatched.set(0);
    }
    async routes(router) {
        router.get('/status', async (req, res) => {
            return res.status(200).json({
                ok: !this.state.diverged,
            });
        });
    }
    async main() {
        const startMs = Date.now();
        let latestBatchIndex;
        try {
            const totalBatches = await this.state.outputOracle.nextOutputIndex();
            latestBatchIndex = totalBatches.toNumber() - 1;
        }
        catch (err) {
            this.logger.error('failed to query total # of batches', {
                error: err,
                node: 'l1',
                section: 'nextOutputIndex',
            });
            this.metrics.nodeConnectionFailures.inc({
                layer: 'l1',
                section: 'nextOutputIndex',
            });
            await (0, core_utils_1.sleep)(15000);
            return;
        }
        if (this.state.currentBatchIndex > latestBatchIndex) {
            this.logger.info('batch index is ahead of the oracle. waiting...', {
                batchIndex: this.state.currentBatchIndex,
                latestBatchIndex,
            });
            await (0, core_utils_1.sleep)(15000);
            return;
        }
        this.metrics.highestBatchIndex.set({ type: 'known' }, latestBatchIndex);
        this.logger.info('checking batch', {
            batchIndex: this.state.currentBatchIndex,
            latestBatchIndex,
        });
        let outputData;
        try {
            outputData = await (0, helpers_1.findOutputForIndex)(this.state.outputOracle, this.state.currentBatchIndex, this.logger);
        }
        catch (err) {
            this.logger.error('failed to fetch output associated with batch', {
                error: err,
                node: 'l1',
                section: 'findOutputForIndex',
                batchIndex: this.state.currentBatchIndex,
            });
            this.metrics.nodeConnectionFailures.inc({
                layer: 'l1',
                section: 'findOutputForIndex',
            });
            await (0, core_utils_1.sleep)(15000);
            return;
        }
        let latestBlock;
        try {
            latestBlock = await this.options.l2RpcProvider.getBlockNumber();
        }
        catch (err) {
            this.logger.error('failed to query L2 block height', {
                error: err,
                node: 'l2',
                section: 'getBlockNumber',
            });
            this.metrics.nodeConnectionFailures.inc({
                layer: 'l2',
                section: 'getBlockNumber',
            });
            await (0, core_utils_1.sleep)(15000);
            return;
        }
        const outputBlockNumber = outputData.l2BlockNumber;
        if (latestBlock < outputBlockNumber) {
            this.logger.info('L2 node is behind, waiting for sync...', {
                l2BlockHeight: latestBlock,
                outputBlock: outputBlockNumber,
            });
            return;
        }
        let outputBlock;
        try {
            outputBlock = await this.options.l2RpcProvider.send('eth_getBlockByNumber', [(0, core_utils_1.toRpcHexString)(outputBlockNumber), false]);
        }
        catch (err) {
            this.logger.error('failed to fetch output block', {
                error: err,
                node: 'l2',
                section: 'getBlock',
                block: outputBlockNumber,
            });
            this.metrics.nodeConnectionFailures.inc({
                layer: 'l2',
                section: 'getBlock',
            });
            await (0, core_utils_1.sleep)(15000);
            return;
        }
        let messagePasserProofResponse;
        try {
            messagePasserProofResponse = await this.options.l2RpcProvider.send('eth_getProof', [
                this.state.messenger.contracts.l2.BedrockMessagePasser.address,
                [],
                (0, core_utils_1.toRpcHexString)(outputBlockNumber),
            ]);
        }
        catch (err) {
            this.logger.error('failed to fetch message passer proof', {
                error: err,
                node: 'l2',
                section: 'getProof',
                block: outputBlockNumber,
            });
            this.metrics.nodeConnectionFailures.inc({
                layer: 'l2',
                section: 'getProof',
            });
            await (0, core_utils_1.sleep)(15000);
            return;
        }
        const outputRoot = ethers_1.ethers.utils.solidityKeccak256(['uint256', 'bytes32', 'bytes32', 'bytes32'], [
            0,
            outputBlock.stateRoot,
            messagePasserProofResponse.storageHash,
            outputBlock.hash,
        ]);
        if (outputRoot !== outputData.outputRoot) {
            this.state.diverged = true;
            this.metrics.isCurrentlyMismatched.set(1);
            this.logger.error('state root mismatch', {
                blockNumber: outputBlock.number,
                expectedStateRoot: outputData.outputRoot,
                actualStateRoot: outputRoot,
                finalizationTime: (0, dateformat_1.default)(new Date((ethers_1.ethers.BigNumber.from(outputBlock.timestamp).toNumber() +
                    this.state.faultProofWindow) *
                    1000), 'mmmm dS, yyyy, h:MM:ss TT'),
            });
            return;
        }
        const elapsedMs = Date.now() - startMs;
        // Mark the current batch index as checked
        this.logger.info('checked batch ok', {
            batchIndex: this.state.currentBatchIndex,
            timeMs: elapsedMs,
        });
        this.metrics.highestBatchIndex.set({ type: 'checked' }, this.state.currentBatchIndex);
        // If we got through the above without throwing an error, we should be
        // fine to reset and move onto the next batch
        this.state.diverged = false;
        this.state.currentBatchIndex++;
        this.metrics.isCurrentlyMismatched.set(0);
    }
}
exports.FaultDetector = FaultDetector;
if (require.main === module) {
    (0, dotenv_1.config)();
    const service = new FaultDetector();
    service.run();
}
