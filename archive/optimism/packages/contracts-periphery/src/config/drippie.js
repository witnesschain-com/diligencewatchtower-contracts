"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSameConfig = exports.parseDrippieConfig = exports.encodeDripCheckParams = exports.getDrippieConfig = exports.Time = void 0;
const assert_1 = __importDefault(require("assert"));
const ethers_1 = require("ethers");
const etherscan_1 = require("../etherscan");
var Time;
(function (Time) {
    Time[Time["SECOND"] = 1] = "SECOND";
    Time[Time["MINUTE"] = 60] = "MINUTE";
    Time[Time["HOUR"] = 3600] = "HOUR";
    Time[Time["DAY"] = 86400] = "DAY";
    Time[Time["WEEK"] = 604800] = "WEEK";
})(Time || (exports.Time = Time = {}));
const getDrippieConfig = async (hre) => {
    let config;
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        config = require(`../../config/drippie/${hre.network.name}.ts`).default;
    }
    catch (err) {
        throw new Error(`error while loading drippie config for network: ${hre.network.name}, ${err}`);
    }
    return (0, exports.parseDrippieConfig)(hre, config);
};
exports.getDrippieConfig = getDrippieConfig;
const encodeDripCheckParams = (iface, params) => {
    return ethers_1.ethers.utils.defaultAbiCoder.encode([iface.getEvent('_EventToExposeStructInABI__Params').inputs[0]], [params]);
};
exports.encodeDripCheckParams = encodeDripCheckParams;
const parseDrippieConfig = async (hre, config) => {
    // Create a clone of the config object. Shallow clone is fine because none of the input options
    // are expected to be objects or functions etc.
    const parsed = { ...config };
    const etherscan = new etherscan_1.Etherscan(hre.network.config.verify.etherscan.apiKey, hre.network.config.chainId);
    for (const dripConfig of Object.values(parsed)) {
        for (const action of dripConfig.actions) {
            (0, assert_1.default)(ethers_1.ethers.utils.isAddress(action.target), 'target is not an address');
            if (action.data === undefined) {
                action.data = '0x';
            }
            else if (typeof action.data === 'string') {
                (0, assert_1.default)(ethers_1.ethers.utils.isHexString(action.data), 'action is not a hex string');
            }
            else {
                const abi = await etherscan.getContractABI(action.target);
                const iface = new ethers_1.ethers.utils.Interface(abi);
                action.data = iface.encodeFunctionData(action.data.fn, action.data.args || []);
            }
            if (action.value === undefined) {
                action.value = ethers_1.ethers.BigNumber.from(0);
            }
            else {
                action.value = ethers_1.ethers.BigNumber.from(action.value);
            }
        }
        const dripcheck = await hre.deployments.get(dripConfig.dripcheck);
        dripConfig.dripcheck = dripcheck.address;
        if (dripConfig.checkparams === undefined) {
            dripConfig.checkparams = '0x';
        }
        else {
            dripConfig.checkparams = (0, exports.encodeDripCheckParams)(new ethers_1.ethers.utils.Interface(dripcheck.abi), dripConfig.checkparams);
        }
        dripConfig.interval = ethers_1.ethers.BigNumber.from(dripConfig.interval);
        dripConfig.reentrant = dripConfig.reentrant || false;
    }
    return parsed;
};
exports.parseDrippieConfig = parseDrippieConfig;
const isSameConfig = (a, b) => {
    return (a.dripcheck.toLowerCase() === b.dripcheck.toLowerCase() &&
        a.checkparams === b.checkparams &&
        ethers_1.ethers.BigNumber.from(a.interval).eq(b.interval) &&
        a.actions.length === b.actions.length &&
        a.actions.every((ax, i) => {
            return (ax.target === b.actions[i].target &&
                ax.data === b.actions[i].data &&
                ethers_1.ethers.BigNumber.from(ax.value).eq(b.actions[i].value));
        }));
};
exports.isSameConfig = isSameConfig;
