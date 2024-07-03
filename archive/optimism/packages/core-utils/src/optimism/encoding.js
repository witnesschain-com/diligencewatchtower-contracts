"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodeCrossDomainMessage = exports.encodeCrossDomainMessageV1 = exports.encodeCrossDomainMessageV0 = exports.decodeVersionedNonce = exports.encodeVersionedNonce = void 0;
const bignumber_1 = require("@ethersproject/bignumber");
const abi_1 = require("@ethersproject/abi");
const iface = new abi_1.Interface([
    'function relayMessage(address,address,bytes,uint256)',
    'function relayMessage(uint256,address,address,uint256,uint256,bytes)',
]);
const nonceMask = bignumber_1.BigNumber.from('0x0000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
/**
 * Encodes the version into the nonce.
 *
 * @param nonce
 * @param version
 */
const encodeVersionedNonce = (nonce, version) => {
    return version.or(nonce.shl(240));
};
exports.encodeVersionedNonce = encodeVersionedNonce;
/**
 * Decodes the version from the nonce and returns the unversioned nonce as well
 * as the version. The version is encoded in the first byte of
 * the nonce. Note that this nonce is the nonce held in the
 * CrossDomainMessenger.
 *
 * @param nonce
 */
const decodeVersionedNonce = (nonce) => {
    return {
        version: nonce.shr(240),
        nonce: nonce.and(nonceMask),
    };
};
exports.decodeVersionedNonce = decodeVersionedNonce;
/**
 * Encodes a V1 cross domain message. This message format was used before
 * bedrock and does not support value transfer because ETH was represented as an
 * ERC20 natively.
 *
 * @param target    The target of the cross domain message
 * @param sender    The sender of the cross domain message
 * @param data      The data passed along with the cross domain message
 * @param nonce     The cross domain message nonce
 */
const encodeCrossDomainMessageV0 = (target, sender, data, nonce) => {
    return iface.encodeFunctionData('relayMessage(address,address,bytes,uint256)', [target, sender, data, nonce]);
};
exports.encodeCrossDomainMessageV0 = encodeCrossDomainMessageV0;
/**
 * Encodes a V1 cross domain message. This message format shipped with bedrock
 * and supports value transfer with native ETH.
 *
 * @param nonce     The cross domain message nonce
 * @param sender    The sender of the cross domain message
 * @param target    The target of the cross domain message
 * @param value     The value being sent with the cross domain message
 * @param gasLimit  The gas limit of the cross domain execution
 * @param data      The data passed along with the cross domain message
 */
const encodeCrossDomainMessageV1 = (nonce, sender, target, value, gasLimit, data) => {
    return iface.encodeFunctionData('relayMessage(uint256,address,address,uint256,uint256,bytes)', [nonce, sender, target, value, gasLimit, data]);
};
exports.encodeCrossDomainMessageV1 = encodeCrossDomainMessageV1;
/**
 * Encodes a cross domain message. The version byte in the nonce determines
 * the serialization format that is used.
 *
 * @param nonce     The cross domain message nonce
 * @param sender    The sender of the cross domain message
 * @param target    The target of the cross domain message
 * @param value     The value being sent with the cross domain message
 * @param gasLimit  The gas limit of the cross domain execution
 * @param data      The data passed along with the cross domain message
 */
const encodeCrossDomainMessage = (nonce, sender, target, value, gasLimit, data) => {
    const { version } = (0, exports.decodeVersionedNonce)(nonce);
    if (version.eq(0)) {
        return (0, exports.encodeCrossDomainMessageV0)(target, sender, data, nonce);
    }
    else if (version.eq(1)) {
        return (0, exports.encodeCrossDomainMessageV1)(nonce, sender, target, value, gasLimit, data);
    }
    throw new Error(`unknown version ${version.toString()}`);
};
exports.encodeCrossDomainMessage = encodeCrossDomainMessage;
