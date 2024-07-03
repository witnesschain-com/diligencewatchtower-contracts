"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toAddress = exports.toNumber = exports.toBigNumber = exports.toTransactionHash = exports.toProvider = exports.toSignerOrProvider = void 0;
const abstract_provider_1 = require("@ethersproject/abstract-provider");
const abstract_signer_1 = require("@ethersproject/abstract-signer");
const ethers_1 = require("ethers");
const assert_1 = require("./assert");
/**
 * Converts a SignerOrProviderLike into a Signer or a Provider. Assumes that if the input is a
 * string then it is a JSON-RPC url.
 *
 * @param signerOrProvider SignerOrProviderLike to turn into a Signer or Provider.
 * @returns Input as a Signer or Provider.
 */
const toSignerOrProvider = (signerOrProvider) => {
    if (typeof signerOrProvider === 'string') {
        return new ethers_1.ethers.providers.JsonRpcProvider(signerOrProvider);
    }
    else if (abstract_provider_1.Provider.isProvider(signerOrProvider)) {
        return signerOrProvider;
    }
    else if (abstract_signer_1.Signer.isSigner(signerOrProvider)) {
        return signerOrProvider;
    }
    else {
        throw new Error('Invalid provider');
    }
};
exports.toSignerOrProvider = toSignerOrProvider;
/**
 * Converts a ProviderLike into a Provider. Assumes that if the input is a string then it is a
 * JSON-RPC url.
 *
 * @param provider ProviderLike to turn into a Provider.
 * @returns Input as a Provider.
 */
const toProvider = (provider) => {
    if (typeof provider === 'string') {
        return new ethers_1.ethers.providers.JsonRpcProvider(provider);
    }
    else if (abstract_provider_1.Provider.isProvider(provider)) {
        return provider;
    }
    else {
        throw new Error('Invalid provider');
    }
};
exports.toProvider = toProvider;
/**
 * Pulls a transaction hash out of a TransactionLike object.
 *
 * @param transaction TransactionLike to convert into a transaction hash.
 * @returns Transaction hash corresponding to the TransactionLike input.
 */
const toTransactionHash = (transaction) => {
    if (typeof transaction === 'string') {
        (0, assert_1.assert)(ethers_1.ethers.utils.isHexString(transaction, 32), 'Invalid transaction hash');
        return transaction;
    }
    else if (transaction.transactionHash) {
        return transaction.transactionHash;
    }
    else if (transaction.hash) {
        return transaction.hash;
    }
    else {
        throw new Error('Invalid transaction');
    }
};
exports.toTransactionHash = toTransactionHash;
/**
 * Converts a number-like into an ethers BigNumber.
 *
 * @param num Number-like to convert into a BigNumber.
 * @returns Number-like as a BigNumber.
 */
const toBigNumber = (num) => {
    return ethers_1.ethers.BigNumber.from(num);
};
exports.toBigNumber = toBigNumber;
/**
 * Converts a number-like into a number.
 *
 * @param num Number-like to convert into a number.
 * @returns Number-like as a number.
 */
const toNumber = (num) => {
    return (0, exports.toBigNumber)(num).toNumber();
};
exports.toNumber = toNumber;
/**
 * Converts an address-like into a 0x-prefixed address string.
 *
 * @param addr Address-like to convert into an address.
 * @returns Address-like as an address.
 */
const toAddress = (addr) => {
    if (typeof addr === 'string') {
        (0, assert_1.assert)(ethers_1.ethers.utils.isAddress(addr), 'Invalid address');
        return ethers_1.ethers.utils.getAddress(addr);
    }
    else {
        (0, assert_1.assert)(ethers_1.ethers.utils.isAddress(addr.address), 'Invalid address');
        return ethers_1.ethers.utils.getAddress(addr.address);
    }
};
exports.toAddress = toAddress;
