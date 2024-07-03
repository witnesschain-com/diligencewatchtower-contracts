"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const src_1 = require("../src");
const ethersProviders_1 = require("./testUtils/ethersProviders");
const crossChainMessenger = new src_1.CrossChainMessenger({
    l1SignerOrProvider: ethersProviders_1.l1Provider,
    l2SignerOrProvider: ethersProviders_1.l2Provider,
    l1ChainId: 5,
    l2ChainId: 420,
    bedrock: true,
});
(0, vitest_1.describe)('prove message', () => {
    (0, vitest_1.it)(`should be able to correctly find a finalized withdrawal`, async () => {
        /**
         * Tx hash of legacy withdrawal that was claimed
         *
         * @see https://goerli-optimism.etherscan.io/tx/0xda9e9c8dfc7718bc1499e1e64d8df6cddbabc46e819475a6c755db286a41b9fa
         */
        const txWithdrawalHash = '0xda9e9c8dfc7718bc1499e1e64d8df6cddbabc46e819475a6c755db286a41b9fa';
        const txReceipt = await ethersProviders_1.l2Provider.getTransactionReceipt(txWithdrawalHash);
        (0, vitest_1.expect)(txReceipt).toBeDefined();
        (0, vitest_1.expect)(await crossChainMessenger.getMessageStatus(txWithdrawalHash)).toBe(src_1.MessageStatus.RELAYED);
    }, 20000);
});
