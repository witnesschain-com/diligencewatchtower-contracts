"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDeployConfig = exports.loadDeployConfig = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const config_1 = require("hardhat/config");
const plugins_1 = require("hardhat/plugins");
const ethers_1 = require("ethers");
// From: https://github.com/wighawag/hardhat-deploy/blob/master/src/index.ts#L63-L76
const normalizePath = (config, userPath, defaultPath) => {
    if (userPath === undefined) {
        userPath = path.join(config.paths.root, defaultPath);
    }
    else {
        if (!path.isAbsolute(userPath)) {
            userPath = path.normalize(path.join(config.paths.root, userPath));
        }
    }
    return userPath;
};
const getDeployConfig = (dir, network) => {
    let config;
    try {
        const base = `${dir}/${network}`;
        if (fs.existsSync(`${base}.ts`)) {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            config = require(`${base}.ts`).default;
        }
        else if (fs.existsSync(`${base}.json`)) {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            config = require(`${base}.json`);
        }
        else {
            throw new Error('not found');
        }
    }
    catch (err) {
        throw new Error(`error while loading deploy config for network: ${network}, ${err}`);
    }
    return config;
};
const loadDeployConfig = (hre) => {
    const paths = hre.config.paths.deployConfig;
    const conf = getDeployConfig(paths, hre.network.name);
    const spec = (0, exports.parseDeployConfig)(hre, conf);
    return new Proxy(spec, {
        get: (target, prop) => {
            if (target.hasOwnProperty(prop)) {
                return target[prop];
            }
            // Explicitly throw if the property is not found
            throw new Error(`property does not exist in deploy config: ${String(prop)}`);
        },
    });
};
exports.loadDeployConfig = loadDeployConfig;
const parseDeployConfig = (hre, config) => {
    // Create a clone of the config object. Shallow clone is fine because none of the input options
    // are expected to be objects or functions etc.
    const parsed = { ...config };
    // If the deployConfigSpec is not provided, do no validation
    if (!hre.config.deployConfigSpec) {
        return parsed;
    }
    for (const [key, spec] of Object.entries(hre.config.deployConfigSpec)) {
        // Make sure the value is defined, or use a default.
        if (parsed[key] === undefined) {
            if ('default' in spec) {
                parsed[key] = spec.default;
            }
            else {
                throw new Error(`deploy config is missing required field: ${key} (${spec.type})`);
            }
        }
        else {
            // Make sure the default has the correct type.
            if (spec.type === 'address') {
                if (!ethers_1.ethers.utils.isAddress(parsed[key])) {
                    throw new Error(`deploy config field: ${key} is not of type ${spec.type}: ${parsed[key]}`);
                }
            }
            else if (typeof parsed[key] !== spec.type) {
                throw new Error(`deploy config field: ${key} is not of type ${spec.type}: ${parsed[key]}`);
            }
        }
    }
    return parsed;
};
exports.parseDeployConfig = parseDeployConfig;
(0, config_1.extendConfig)((config, userConfig) => {
    config.paths.deployConfig = normalizePath(config, userConfig.paths?.deployConfig, 'deploy-config');
});
(0, config_1.extendEnvironment)((hre) => {
    hre.deployConfig = (0, plugins_1.lazyObject)(() => (0, exports.loadDeployConfig)(hre));
    hre.getDeployConfig = (0, plugins_1.lazyFunction)(() => {
        const paths = hre.config.paths.deployConfig;
        return (network) => getDeployConfig(paths, network);
    });
});
