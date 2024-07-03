"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const setup_1 = require("../setup");
const message_utils_1 = require("../../src/utils/message-utils");
const goerliChainID = 420;
describe('Message Utils', () => {
    describe('migratedWithdrawalGasLimit', () => {
        it('should have a max of 25 million', () => {
            const data = '0x' + 'ff'.repeat(15000000);
            const result = (0, message_utils_1.migratedWithdrawalGasLimit)(data, goerliChainID);
            (0, setup_1.expect)(result).to.eq(ethers_1.BigNumber.from(25000000));
        });
        it('should work for mixes of zeros and ones', () => {
            const tests = [
                { input: '0x', result: ethers_1.BigNumber.from(200000) },
                { input: '0xff', result: ethers_1.BigNumber.from(200000 + 16) },
                { input: '0xff00', result: ethers_1.BigNumber.from(200000 + 16 + 16) },
                { input: '0x00', result: ethers_1.BigNumber.from(200000 + 16) },
                { input: '0x000000', result: ethers_1.BigNumber.from(200000 + 16 + 16 + 16) },
            ];
            for (const test of tests) {
                const result = (0, message_utils_1.migratedWithdrawalGasLimit)(test.input, goerliChainID);
                (0, setup_1.expect)(result).to.eq(test.result);
            }
        });
    });
    /**
     * Test that storage slot computation is correct. The test vectors are
     * from actual migrated withdrawals on goerli.
     */
    describe('Withdrawal Hashing', () => {
        it('should work', () => {
            const tests = [
                {
                    input: {
                        messageNonce: ethers_1.BigNumber.from(100000),
                        sender: '0x4200000000000000000000000000000000000007',
                        target: '0x5086d1eEF304eb5284A0f6720f79403b4e9bE294',
                        value: ethers_1.BigNumber.from(0),
                        minGasLimit: ethers_1.BigNumber.from(207744),
                        message: '0xd764ad0b00000000000000000000000000000000000000000000000000000000000186a00000000000000000000000004200000000000000000000000000000000000010000000000000000000000000636af16bf2f682dd3109e60102b8e1a089fedaa80000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000e4a9f9e67500000000000000000000000007865c6e87b9f70255377e024ace6630c1eaa37f0000000000000000000000003b8e53b3ab8e01fb57d0c9e893bc4d655aa67d84000000000000000000000000b91882244f7f82540f2941a759724523c7b9a166000000000000000000000000b91882244f7f82540f2941a759724523c7b9a166000000000000000000000000000000000000000000000000000000000000271000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
                    },
                    result: '0x7c83d39edf60c0ab61bc7cfd2e5f741efdf02fd6e2da0f12318f0d1858d3773b',
                },
                {
                    input: {
                        messageNonce: ethers_1.BigNumber.from(100001),
                        sender: '0x4200000000000000000000000000000000000007',
                        target: '0x5086d1eEF304eb5284A0f6720f79403b4e9bE294',
                        value: ethers_1.BigNumber.from(0),
                        minGasLimit: ethers_1.BigNumber.from(207744),
                        message: '0xd764ad0b00000000000000000000000000000000000000000000000000000000000186a10000000000000000000000004200000000000000000000000000000000000010000000000000000000000000636af16bf2f682dd3109e60102b8e1a089fedaa80000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000e4a9f9e67500000000000000000000000007865c6e87b9f70255377e024ace6630c1eaa37f0000000000000000000000004e62882864fb8ce54affcaf8d899a286762b011b000000000000000000000000b91882244f7f82540f2941a759724523c7b9a166000000000000000000000000b91882244f7f82540f2941a759724523c7b9a166000000000000000000000000000000000000000000000000000000000000271000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
                    },
                    result: '0x17c90d87508a23d806962f4c5f366ef505e8d80e5cc2a5c87242560c21d7c588',
                },
            ];
            for (const test of tests) {
                const hash = (0, message_utils_1.hashLowLevelMessage)(test.input);
                const messageSlot = (0, message_utils_1.hashMessageHash)(hash);
                (0, setup_1.expect)(messageSlot).to.eq(test.result);
            }
        });
    });
});
