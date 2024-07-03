"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const src_1 = require("../../src");
const config = {
    GelatoBalance: {
        interval: 1 * src_1.Time.DAY,
        dripcheck: 'CheckGelatoLow',
        checkparams: {
            treasury: '0x527a819db1eb0e34426297b03bae11F2f8B3A19E',
            recipient: '0xc37f6a6c4AB335E20d10F034B90386E2fb70bbF5',
            threshold: ethers_1.ethers.utils.parseEther('0.1'),
        },
        actions: [
            {
                target: '0x527a819db1eb0e34426297b03bae11F2f8B3A19E',
                value: ethers_1.ethers.utils.parseEther('1'),
                data: {
                    fn: 'depositFunds',
                    args: [
                        // receiver
                        '0xc37f6a6c4AB335E20d10F034B90386E2fb70bbF5',
                        // token
                        '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                        // amount
                        ethers_1.ethers.utils.parseEther('1'),
                    ],
                },
            },
        ],
    },
    TonyOptimismKovanFaucet: {
        interval: 1 * src_1.Time.WEEK,
        dripcheck: 'CheckBalanceLow',
        checkparams: {
            target: '0xa8019d6F7bC3008a0a708A422f223Ccb21b61eAD',
            threshold: ethers_1.ethers.utils.parseEther('20'),
        },
        actions: [
            {
                target: '0xa8019d6F7bC3008a0a708A422f223Ccb21b61eAD',
                value: ethers_1.ethers.utils.parseEther('100'),
            },
        ],
    },
};
exports.default = config;
