"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.migratedWithdrawalGasLimit = exports.hashMessageHash = exports.hashLowLevelMessage = void 0;
const core_utils_1 = require("@eth-optimism/core-utils");
const ethers_1 = require("ethers");
const { hexDataLength } = ethers_1.utils;
// Constants used by `CrossDomainMessenger.baseGas`
const RELAY_CONSTANT_OVERHEAD = ethers_1.BigNumber.from(200000);
const RELAY_PER_BYTE_DATA_COST = ethers_1.BigNumber.from(16);
const MIN_GAS_DYNAMIC_OVERHEAD_NUMERATOR = ethers_1.BigNumber.from(64);
const MIN_GAS_DYNAMIC_OVERHEAD_DENOMINATOR = ethers_1.BigNumber.from(63);
const RELAY_CALL_OVERHEAD = ethers_1.BigNumber.from(40000);
const RELAY_RESERVED_GAS = ethers_1.BigNumber.from(40000);
const RELAY_GAS_CHECK_BUFFER = ethers_1.BigNumber.from(5000);
/**
 * Utility for hashing a LowLevelMessage object.
 *
 * @param message LowLevelMessage object to hash.
 * @returns Hash of the given LowLevelMessage.
 */
const hashLowLevelMessage = (message) => {
    return (0, core_utils_1.hashWithdrawal)(message.messageNonce, message.sender, message.target, message.value, message.minGasLimit, message.message);
};
exports.hashLowLevelMessage = hashLowLevelMessage;
/**
 * Utility for hashing a message hash. This computes the storage slot
 * where the message hash will be stored in state. HashZero is used
 * because the first mapping in the contract is used.
 *
 * @param messageHash Message hash to hash.
 * @returns Hash of the given message hash.
 */
const hashMessageHash = (messageHash) => {
    const data = ethers_1.ethers.utils.defaultAbiCoder.encode(['bytes32', 'uint256'], [messageHash, ethers_1.ethers.constants.HashZero]);
    return ethers_1.ethers.utils.keccak256(data);
};
exports.hashMessageHash = hashMessageHash;
/**
 * Compute the min gas limit for a migrated withdrawal.
 */
const migratedWithdrawalGasLimit = (data, chainID) => {
    // Compute the gas limit and cap at 25 million
    const dataCost = ethers_1.BigNumber.from(hexDataLength(data)).mul(RELAY_PER_BYTE_DATA_COST);
    let overhead;
    if (chainID === 420) {
        overhead = ethers_1.BigNumber.from(200000);
    }
    else {
        // Dynamic overhead (EIP-150)
        // We use a constant 1 million gas limit due to the overhead of simulating all migrated withdrawal
        // transactions during the migration. This is a conservative estimate, and if a withdrawal
        // uses more than the minimum gas limit, it will fail and need to be replayed with a higher
        // gas limit.
        const dynamicOverhead = MIN_GAS_DYNAMIC_OVERHEAD_NUMERATOR.mul(1000000).div(MIN_GAS_DYNAMIC_OVERHEAD_DENOMINATOR);
        // Constant overhead
        overhead = RELAY_CONSTANT_OVERHEAD.add(dynamicOverhead)
            .add(RELAY_CALL_OVERHEAD)
            // Gas reserved for the worst-case cost of 3/5 of the `CALL` opcode's dynamic gas
            // factors. (Conservative)
            // Relay reserved gas (to ensure execution of `relayMessage` completes after the
            // subcontext finishes executing) (Conservative)
            .add(RELAY_RESERVED_GAS)
            // Gas reserved for the execution between the `hasMinGas` check and the `CALL`
            // opcode. (Conservative)
            .add(RELAY_GAS_CHECK_BUFFER);
    }
    let minGasLimit = dataCost.add(overhead);
    if (minGasLimit.gt(25000000)) {
        minGasLimit = ethers_1.BigNumber.from(25000000);
    }
    return minGasLimit;
};
exports.migratedWithdrawalGasLimit = migratedWithdrawalGasLimit;
