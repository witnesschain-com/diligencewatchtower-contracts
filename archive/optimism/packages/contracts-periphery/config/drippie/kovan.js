"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const src_1 = require("../../src");
const config = {
    TeleportrWithdrawal: {
        interval: 10 * src_1.Time.MINUTE,
        dripcheck: 'CheckBalanceHigh',
        checkparams: {
            target: '0x4821975ca220601c153d02353300d6ad34adc362',
            threshold: ethers_1.ethers.utils.parseEther('1'),
        },
        actions: [
            {
                target: '0x78A25524D90E3D0596558fb43789bD800a5c3007',
                data: {
                    fn: 'withdrawFromTeleportr',
                    args: [],
                },
            },
        ],
    },
    GelatoBalance: {
        interval: 1 * src_1.Time.DAY,
        dripcheck: 'CheckGelatoLow',
        checkparams: {
            treasury: '0x340759c8346A1E6Ed92035FB8B6ec57cE1D82c2c',
            recipient: '0xc37f6a6c4AB335E20d10F034B90386E2fb70bbF5',
            threshold: ethers_1.ethers.utils.parseEther('0.1'),
        },
        actions: [
            {
                target: '0x340759c8346A1E6Ed92035FB8B6ec57cE1D82c2c',
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
};
exports.default = config;
