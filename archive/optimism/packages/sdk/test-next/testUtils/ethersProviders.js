"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.l2Provider = exports.l1Provider = void 0;
const ethers_1 = __importDefault(require("ethers"));
const zod_1 = require("zod");
const E2E_RPC_URL_L1 = zod_1.z
    .string()
    .url()
    .describe('L1 ethereum rpc Url')
    .parse(import.meta.env.VITE_E2E_RPC_URL_L1);
const E2E_RPC_URL_L2 = zod_1.z
    .string()
    .url()
    .describe('L1 ethereum rpc Url')
    .parse(import.meta.env.VITE_E2E_RPC_URL_L2);
const jsonRpcHeaders = { 'User-Agent': 'eth-optimism/@gateway/backend' };
/**
 * Initialize the signer, prover, and cross chain messenger
 */
const l1Provider = new ethers_1.default.providers.JsonRpcProvider({
    url: E2E_RPC_URL_L1,
    headers: jsonRpcHeaders,
});
exports.l1Provider = l1Provider;
const l2Provider = new ethers_1.default.providers.JsonRpcProvider({
    url: E2E_RPC_URL_L2,
    headers: jsonRpcHeaders,
});
exports.l2Provider = l2Provider;
