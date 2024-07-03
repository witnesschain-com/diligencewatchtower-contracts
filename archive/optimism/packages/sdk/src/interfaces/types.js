"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageReceiptStatus = exports.MessageDirection = exports.MessageStatus = exports.L2ChainID = exports.L1ChainID = void 0;
/**
 * L1 network chain IDs
 */
var L1ChainID;
(function (L1ChainID) {
    L1ChainID[L1ChainID["MAINNET"] = 1] = "MAINNET";
    L1ChainID[L1ChainID["GOERLI"] = 5] = "GOERLI";
    L1ChainID[L1ChainID["HARDHAT_LOCAL"] = 31337] = "HARDHAT_LOCAL";
    L1ChainID[L1ChainID["BEDROCK_LOCAL_DEVNET"] = 900] = "BEDROCK_LOCAL_DEVNET";
})(L1ChainID || (exports.L1ChainID = L1ChainID = {}));
/**
 * L2 network chain IDs
 */
var L2ChainID;
(function (L2ChainID) {
    L2ChainID[L2ChainID["OPTIMISM"] = 10] = "OPTIMISM";
    L2ChainID[L2ChainID["OPTIMISM_GOERLI"] = 420] = "OPTIMISM_GOERLI";
    L2ChainID[L2ChainID["OPTIMISM_HARDHAT_LOCAL"] = 31337] = "OPTIMISM_HARDHAT_LOCAL";
    L2ChainID[L2ChainID["OPTIMISM_HARDHAT_DEVNET"] = 17] = "OPTIMISM_HARDHAT_DEVNET";
    L2ChainID[L2ChainID["OPTIMISM_BEDROCK_LOCAL_DEVNET"] = 901] = "OPTIMISM_BEDROCK_LOCAL_DEVNET";
    L2ChainID[L2ChainID["OPTIMISM_BEDROCK_ALPHA_TESTNET"] = 28528] = "OPTIMISM_BEDROCK_ALPHA_TESTNET";
    L2ChainID[L2ChainID["BASE_GOERLI"] = 84531] = "BASE_GOERLI";
    L2ChainID[L2ChainID["ZORA_GOERLI"] = 999] = "ZORA_GOERLI";
    L2ChainID[L2ChainID["ZORA_MAINNET"] = 7777777] = "ZORA_MAINNET";
})(L2ChainID || (exports.L2ChainID = L2ChainID = {}));
/**
 * Enum describing the status of a message.
 */
var MessageStatus;
(function (MessageStatus) {
    /**
     * Message is an L1 to L2 message and has not been processed by the L2.
     */
    MessageStatus[MessageStatus["UNCONFIRMED_L1_TO_L2_MESSAGE"] = 0] = "UNCONFIRMED_L1_TO_L2_MESSAGE";
    /**
     * Message is an L1 to L2 message and the transaction to execute the message failed.
     * When this status is returned, you will need to resend the L1 to L2 message, probably with a
     * higher gas limit.
     */
    MessageStatus[MessageStatus["FAILED_L1_TO_L2_MESSAGE"] = 1] = "FAILED_L1_TO_L2_MESSAGE";
    /**
     * Message is an L2 to L1 message and no state root has been published yet.
     */
    MessageStatus[MessageStatus["STATE_ROOT_NOT_PUBLISHED"] = 2] = "STATE_ROOT_NOT_PUBLISHED";
    /**
     * Message is ready to be proved on L1 to initiate the challenge period.
     */
    MessageStatus[MessageStatus["READY_TO_PROVE"] = 3] = "READY_TO_PROVE";
    /**
     * Message is a proved L2 to L1 message and is undergoing the challenge period.
     */
    MessageStatus[MessageStatus["IN_CHALLENGE_PERIOD"] = 4] = "IN_CHALLENGE_PERIOD";
    /**
     * Message is ready to be relayed.
     */
    MessageStatus[MessageStatus["READY_FOR_RELAY"] = 5] = "READY_FOR_RELAY";
    /**
     * Message has been relayed.
     */
    MessageStatus[MessageStatus["RELAYED"] = 6] = "RELAYED";
})(MessageStatus || (exports.MessageStatus = MessageStatus = {}));
/**
 * Enum describing the direction of a message.
 */
var MessageDirection;
(function (MessageDirection) {
    MessageDirection[MessageDirection["L1_TO_L2"] = 0] = "L1_TO_L2";
    MessageDirection[MessageDirection["L2_TO_L1"] = 1] = "L2_TO_L1";
})(MessageDirection || (exports.MessageDirection = MessageDirection = {}));
/**
 * Enum describing the status of a CrossDomainMessage message receipt.
 */
var MessageReceiptStatus;
(function (MessageReceiptStatus) {
    MessageReceiptStatus[MessageReceiptStatus["RELAYED_FAILED"] = 0] = "RELAYED_FAILED";
    MessageReceiptStatus[MessageReceiptStatus["RELAYED_SUCCEEDED"] = 1] = "RELAYED_SUCCEEDED";
})(MessageReceiptStatus || (exports.MessageReceiptStatus = MessageReceiptStatus = {}));
