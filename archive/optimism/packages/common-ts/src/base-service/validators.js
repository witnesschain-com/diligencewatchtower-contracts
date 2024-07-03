"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validators = void 0;
const envalid_1 = require("envalid");
const ethers_1 = require("ethers");
const common_1 = require("../common");
const provider = (0, envalid_1.makeValidator)((input) => {
    const parsed = (0, envalid_1.url)()._parse(input);
    return new ethers_1.ethers.providers.JsonRpcProvider(parsed);
});
const jsonRpcProvider = (0, envalid_1.makeValidator)((input) => {
    const parsed = (0, envalid_1.url)()._parse(input);
    return new ethers_1.ethers.providers.JsonRpcProvider(parsed);
});
const staticJsonRpcProvider = (0, envalid_1.makeValidator)((input) => {
    const parsed = (0, envalid_1.url)()._parse(input);
    return new ethers_1.ethers.providers.StaticJsonRpcProvider(parsed);
});
const wallet = (0, envalid_1.makeValidator)((input) => {
    if (!ethers_1.ethers.utils.isHexString(input)) {
        throw new Error(`expected wallet to be a hex string`);
    }
    else {
        return new ethers_1.ethers.Wallet(input);
    }
});
const logLevel = (0, envalid_1.makeValidator)((input) => {
    if (!common_1.logLevels.includes(input)) {
        throw new Error(`expected log level to be one of ${common_1.logLevels.join(', ')}`);
    }
    else {
        return input;
    }
});
exports.validators = {
    str: envalid_1.str,
    bool: envalid_1.bool,
    num: envalid_1.num,
    email: envalid_1.email,
    host: envalid_1.host,
    port: envalid_1.port,
    url: envalid_1.url,
    json: envalid_1.json,
    wallet,
    provider,
    jsonRpcProvider,
    staticJsonRpcProvider,
    logLevel,
};
