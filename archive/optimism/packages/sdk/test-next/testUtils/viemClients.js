"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.l2WalletClient = exports.l1WalletClient = exports.l2PublicClient = exports.l1PublicClient = exports.l2TestClient = exports.l1TestClient = void 0;
const viem_1 = require("viem");
const chains_1 = require("viem/chains");
// we should instead use .env to determine chain so we can support alternate l1/l2 pairs
const L1_CHAIN = chains_1.goerli;
const L2_CHAIN = chains_1.optimismGoerli;
const L1_RPC_URL = 'http://localhost:8545';
const L2_RPC_URL = 'http://localhost:9545';
const l1TestClient = (0, viem_1.createTestClient)({
    mode: 'anvil',
    chain: L1_CHAIN,
    transport: (0, viem_1.http)(L1_RPC_URL),
});
exports.l1TestClient = l1TestClient;
const l2TestClient = (0, viem_1.createTestClient)({
    mode: 'anvil',
    chain: L2_CHAIN,
    transport: (0, viem_1.http)(L2_RPC_URL),
});
exports.l2TestClient = l2TestClient;
const l1PublicClient = (0, viem_1.createPublicClient)({
    chain: L1_CHAIN,
    transport: (0, viem_1.http)(L1_RPC_URL),
});
exports.l1PublicClient = l1PublicClient;
const l2PublicClient = (0, viem_1.createPublicClient)({
    chain: L2_CHAIN,
    transport: (0, viem_1.http)(L2_RPC_URL),
});
exports.l2PublicClient = l2PublicClient;
const l1WalletClient = (0, viem_1.createWalletClient)({
    chain: L1_CHAIN,
    transport: (0, viem_1.http)(L1_RPC_URL),
});
exports.l1WalletClient = l1WalletClient;
const l2WalletClient = (0, viem_1.createWalletClient)({
    chain: L2_CHAIN,
    transport: (0, viem_1.http)(L2_RPC_URL),
});
exports.l2WalletClient = l2WalletClient;
