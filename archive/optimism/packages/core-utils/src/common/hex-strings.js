"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bytes32ify = exports.hexStringEquals = exports.encodeHex = exports.padHexString = exports.toRpcHexString = exports.toHexString = exports.fromHexString = exports.add0x = exports.remove0x = void 0;
/* Imports: External */
const bignumber_1 = require("@ethersproject/bignumber");
const bytes_1 = require("@ethersproject/bytes");
/**
 * Removes "0x" from start of a string if it exists.
 *
 * @param str String to modify.
 * @returns the string without "0x".
 */
const remove0x = (str) => {
    if (str === undefined) {
        return str;
    }
    return str.startsWith('0x') ? str.slice(2) : str;
};
exports.remove0x = remove0x;
/**
 * Adds "0x" to the start of a string if necessary.
 *
 * @param str String to modify.
 * @returns the string with "0x".
 */
const add0x = (str) => {
    if (str === undefined) {
        return str;
    }
    return str.startsWith('0x') ? str : '0x' + str;
};
exports.add0x = add0x;
/**
 * Casts a hex string to a buffer.
 *
 * @param inp Input to cast to a buffer.
 * @return Input cast as a buffer.
 */
const fromHexString = (inp) => {
    if (typeof inp === 'string' && inp.startsWith('0x')) {
        return Buffer.from(inp.slice(2), 'hex');
    }
    return Buffer.from(inp);
};
exports.fromHexString = fromHexString;
/**
 * Casts an input to a hex string.
 *
 * @param inp Input to cast to a hex string.
 * @return Input cast as a hex string.
 */
const toHexString = (inp) => {
    if (typeof inp === 'number') {
        return bignumber_1.BigNumber.from(inp).toHexString();
    }
    else {
        return '0x' + (0, exports.fromHexString)(inp).toString('hex');
    }
};
exports.toHexString = toHexString;
/**
 * Casts a number to a hex string without zero padding.
 *
 * @param n Number to cast to a hex string.
 * @return Number cast as a hex string.
 */
const toRpcHexString = (n) => {
    let num;
    if (typeof n === 'number') {
        num = '0x' + n.toString(16);
    }
    else {
        num = n.toHexString();
    }
    if (num === '0x0') {
        return num;
    }
    else {
        // BigNumber pads a single 0 to keep hex length even
        return num.replace(/^0x0/, '0x');
    }
};
exports.toRpcHexString = toRpcHexString;
/**
 * Zero pads a hex string if str.length !== 2 + length * 2. Pads to length * 2.
 *
 * @param str Hex string to pad
 * @param length Half the length of the desired padded hex string
 * @return Hex string with length of 2 + length * 2
 */
const padHexString = (str, length) => {
    if (str.length === 2 + length * 2) {
        return str;
    }
    else {
        return '0x' + str.slice(2).padStart(length * 2, '0');
    }
};
exports.padHexString = padHexString;
/**
 * Casts an input to hex string without '0x' prefix with conditional padding.
 * Hex string will always start with a 0.
 *
 * @param val Input to cast to a hex string.
 * @param len Desired length to pad hex string. Ignored if less than hex string length.
 * @return Hex string with '0' prefix
 */
const encodeHex = (val, len) => (0, exports.remove0x)(bignumber_1.BigNumber.from(val).toHexString()).padStart(len, '0');
exports.encodeHex = encodeHex;
/**
 * Case insensitive hex string equality check
 *
 * @param stringA Hex string A
 * @param stringB Hex string B
 * @throws {Error} Inputs must be valid hex strings
 * @return True if equal
 */
const hexStringEquals = (stringA, stringB) => {
    if (!(0, bytes_1.isHexString)(stringA)) {
        throw new Error(`input is not a hex string: ${stringA}`);
    }
    if (!(0, bytes_1.isHexString)(stringB)) {
        throw new Error(`input is not a hex string: ${stringB}`);
    }
    return stringA.toLowerCase() === stringB.toLowerCase();
};
exports.hexStringEquals = hexStringEquals;
/**
 * Casts a number to a 32-byte, zero padded hex string.
 *
 * @param value Number to cast to a hex string.
 * @return Number cast as a hex string.
 */
const bytes32ify = (value) => {
    return (0, bytes_1.hexZeroPad)(bignumber_1.BigNumber.from(value).toHexString(), 32);
};
exports.bytes32ify = bytes32ify;
