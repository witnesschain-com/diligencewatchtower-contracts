"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Hardhat plugins
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");
const config = {
    mocha: {
        timeout: 50000,
    },
};
exports.default = config;
