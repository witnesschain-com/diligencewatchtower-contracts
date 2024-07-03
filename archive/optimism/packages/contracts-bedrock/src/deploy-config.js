"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deployConfigSpec = void 0;
const ethers_1 = require("ethers");
/**
 * Deployment configuration specification for the hardhat plugin.
 */
exports.deployConfigSpec = {
    numDeployConfirmations: {
        type: 'number',
        default: 1,
    },
    finalSystemOwner: {
        type: 'address',
    },
    portalGuardian: {
        type: 'address',
    },
    controller: {
        type: 'address',
    },
    l1StartingBlockTag: {
        type: 'string',
    },
    l1ChainID: {
        type: 'number',
    },
    l2ChainID: {
        type: 'number',
    },
    l2BlockTime: {
        type: 'number',
    },
    maxSequencerDrift: {
        type: 'number',
    },
    sequencerWindowSize: {
        type: 'number',
    },
    channelTimeout: {
        type: 'number',
    },
    p2pSequencerAddress: {
        type: 'address',
    },
    batchInboxAddress: {
        type: 'address',
    },
    batchSenderAddress: {
        type: 'address',
    },
    l2OutputOracleSubmissionInterval: {
        type: 'number',
    },
    l2OutputOracleStartingBlockNumber: {
        type: 'number',
        default: 0,
    },
    l2OutputOracleStartingTimestamp: {
        type: 'number',
    },
    l2OutputOracleProposer: {
        type: 'address',
    },
    l2OutputOracleChallenger: {
        type: 'address',
    },
    finalizationPeriodSeconds: {
        type: 'number',
        default: 2,
    },
    proxyAdminOwner: {
        type: 'address',
    },
    baseFeeVaultRecipient: {
        type: 'address',
    },
    l1FeeVaultRecipient: {
        type: 'address',
    },
    sequencerFeeVaultRecipient: {
        type: 'address',
    },
    baseFeeVaultMinimumWithdrawalAmount: {
        type: 'string',
        default: '0x8ac7230489e80000', // 10 ether
    },
    l1FeeVaultMinimumWithdrawalAmount: {
        type: 'string',
        default: '0x8ac7230489e80000', // 10 ether
    },
    sequencerFeeVaultMinimumWithdrawalAmount: {
        type: 'string',
        default: '0x8ac7230489e80000', // 10 ether
    },
    baseFeeVaultWithdrawalNetwork: {
        type: 'number',
    },
    l1FeeVaultWithdrawalNetwork: {
        type: 'number',
    },
    sequencerFeeVaultWithdrawalNetwork: {
        type: 'number',
    },
    cliqueSignerAddress: {
        type: 'address',
        default: ethers_1.ethers.constants.AddressZero,
    },
    l1BlockTime: {
        type: 'number',
        default: 15,
    },
    l1GenesisBlockNonce: {
        type: 'string', // uint64
        default: '0x0',
    },
    l1GenesisBlockGasLimit: {
        type: 'string',
        default: ethers_1.ethers.BigNumber.from(15000000).toHexString(),
    },
    l1GenesisBlockDifficulty: {
        type: 'string', // uint256
        default: '0x1',
    },
    l1GenesisBlockMixHash: {
        type: 'string', // bytes32
        default: ethers_1.ethers.constants.HashZero,
    },
    l1GenesisBlockCoinbase: {
        type: 'address',
        default: ethers_1.ethers.constants.AddressZero,
    },
    l1GenesisBlockNumber: {
        type: 'string', // uint64
        default: '0x0',
    },
    l1GenesisBlockGasUsed: {
        type: 'string', // uint64
        default: '0x0',
    },
    l1GenesisBlockParentHash: {
        type: 'string', // bytes32
        default: ethers_1.ethers.constants.HashZero,
    },
    l1GenesisBlockBaseFeePerGas: {
        type: 'string', // uint256
        default: ethers_1.ethers.BigNumber.from(1000000000).toHexString(), // 1 gwei
    },
    l2GenesisBlockNonce: {
        type: 'string', // uint64
        default: '0x0',
    },
    l2GenesisBlockGasLimit: {
        type: 'string',
        default: ethers_1.ethers.BigNumber.from(15000000).toHexString(),
    },
    l2GenesisBlockDifficulty: {
        type: 'string', // uint256
        default: '0x1',
    },
    l2GenesisBlockMixHash: {
        type: 'string', // bytes32
        default: ethers_1.ethers.constants.HashZero,
    },
    l2GenesisBlockNumber: {
        type: 'string', // uint64
        default: '0x0',
    },
    l2GenesisBlockGasUsed: {
        type: 'string', // uint64
        default: '0x0',
    },
    l2GenesisBlockParentHash: {
        type: 'string', // bytes32
        default: ethers_1.ethers.constants.HashZero,
    },
    l2GenesisBlockBaseFeePerGas: {
        type: 'string', // uint256
        default: ethers_1.ethers.BigNumber.from(1000000000).toHexString(), // 1 gwei
    },
    gasPriceOracleOverhead: {
        type: 'number',
        default: 2100,
    },
    gasPriceOracleScalar: {
        type: 'number',
        default: 1000000,
    },
    enableGovernance: {
        type: 'boolean',
        default: false,
    },
    governanceTokenSymbol: {
        type: 'string',
    },
    governanceTokenName: {
        type: 'string',
    },
    governanceTokenOwner: {
        type: 'string',
    },
};
