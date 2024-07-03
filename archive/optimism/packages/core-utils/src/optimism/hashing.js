"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashOutputRootProof = exports.hashWithdrawal = exports.hashCrossDomainMessagev1 = exports.hashCrossDomainMessagev0 = exports.hashCrossDomainMessage = void 0;
const keccak256_1 = require("@ethersproject/keccak256");
const abi_1 = require("@ethersproject/abi");
const encoding_1 = require("./encoding");
/**
 * Hahses a cross domain message.
 *
 * @param nonce     The cross domain message nonce
 * @param sender    The sender of the cross domain message
 * @param target    The target of the cross domain message
 * @param value     The value being sent with the cross domain message
 * @param gasLimit  The gas limit of the cross domain execution
 * @param data      The data passed along with the cross domain message
 */
const hashCrossDomainMessage = (nonce, sender, target, value, gasLimit, message) => {
    const { version } = (0, encoding_1.decodeVersionedNonce)(nonce);
    if (version.eq(0)) {
        return (0, exports.hashCrossDomainMessagev0)(target, sender, message, nonce);
    }
    else if (version.eq(1)) {
        return (0, exports.hashCrossDomainMessagev1)(nonce, sender, target, value, gasLimit, message);
    }
    throw new Error(`unknown version ${version.toString()}`);
};
exports.hashCrossDomainMessage = hashCrossDomainMessage;
/**
 * Hahses a V0 cross domain message
 *
 * @param target    The target of the cross domain message
 * @param sender    The sender of the cross domain message
 * @param message      The message passed along with the cross domain message
 * @param nonce     The cross domain message nonce
 */
const hashCrossDomainMessagev0 = (target, sender, message, nonce) => {
    return (0, keccak256_1.keccak256)((0, encoding_1.encodeCrossDomainMessageV0)(target, sender, message, nonce));
};
exports.hashCrossDomainMessagev0 = hashCrossDomainMessagev0;
/**
 * Hahses a V1 cross domain message
 *
 * @param nonce     The cross domain message nonce
 * @param sender    The sender of the cross domain message
 * @param target    The target of the cross domain message
 * @param value     The value being sent with the cross domain message
 * @param gasLimit  The gas limit of the cross domain execution
 * @param message      The message passed along with the cross domain message
 */
const hashCrossDomainMessagev1 = (nonce, sender, target, value, gasLimit, message) => {
    return (0, keccak256_1.keccak256)((0, encoding_1.encodeCrossDomainMessageV1)(nonce, sender, target, value, gasLimit, message));
};
exports.hashCrossDomainMessagev1 = hashCrossDomainMessagev1;
/**
 * Hashes a withdrawal
 *
 * @param nonce     The cross domain message nonce
 * @param sender    The sender of the cross domain message
 * @param target    The target of the cross domain message
 * @param value     The value being sent with the cross domain message
 * @param gasLimit  The gas limit of the cross domain execution
 * @param message      The message passed along with the cross domain message
 */
const hashWithdrawal = (nonce, sender, target, value, gasLimit, message) => {
    const types = ['uint256', 'address', 'address', 'uint256', 'uint256', 'bytes'];
    const encoded = abi_1.defaultAbiCoder.encode(types, [
        nonce,
        sender,
        target,
        value,
        gasLimit,
        message,
    ]);
    return (0, keccak256_1.keccak256)(encoded);
};
exports.hashWithdrawal = hashWithdrawal;
/**
 * Hahses an output root proof
 *
 * @param proof OutputRootProof
 */
const hashOutputRootProof = (proof) => {
    return (0, keccak256_1.keccak256)(abi_1.defaultAbiCoder.encode(['bytes32', 'bytes32', 'bytes32', 'bytes32'], [
        proof.version,
        proof.stateRoot,
        proof.messagePasserStorageRoot,
        proof.latestBlockhash,
    ]));
};
exports.hashOutputRootProof = hashOutputRootProof;
