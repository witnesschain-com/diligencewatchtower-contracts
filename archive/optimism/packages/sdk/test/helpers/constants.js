"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DUMMY_EXTENDED_MESSAGE = exports.DUMMY_MESSAGE = void 0;
const ethers_1 = require("ethers");
exports.DUMMY_MESSAGE = {
    target: '0x' + '11'.repeat(20),
    sender: '0x' + '22'.repeat(20),
    message: '0x' + '33'.repeat(64),
    messageNonce: ethers_1.ethers.BigNumber.from(1234),
    value: ethers_1.ethers.BigNumber.from(0),
    minGasLimit: ethers_1.ethers.BigNumber.from(5678),
};
exports.DUMMY_EXTENDED_MESSAGE = {
    ...exports.DUMMY_MESSAGE,
    logIndex: 0,
    blockNumber: 1234,
    transactionHash: '0x' + '44'.repeat(32),
};
