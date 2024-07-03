"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicOptions = exports.stdOptionsSpec = void 0;
const validators_1 = require("./validators");
/**
 * Specification for standard options.
 */
exports.stdOptionsSpec = {
    loopIntervalMs: {
        validator: validators_1.validators.num,
        desc: 'Loop interval in milliseconds, only applies if service is set to loop',
        default: 0,
        public: true,
    },
    port: {
        validator: validators_1.validators.num,
        desc: 'Port for the app server',
        default: 7300,
        public: true,
    },
    hostname: {
        validator: validators_1.validators.str,
        desc: 'Hostname for the app server',
        default: '0.0.0.0',
        public: true,
    },
    logLevel: {
        validator: validators_1.validators.logLevel,
        desc: 'Log level',
        default: 'debug',
        public: true,
    },
    useEnv: {
        validator: validators_1.validators.bool,
        desc: 'For programmatic use, whether to use environment variables',
        default: true,
        public: true,
    },
    useArgv: {
        validator: validators_1.validators.bool,
        desc: 'For programmatic use, whether to use command line arguments',
        default: true,
        public: true,
    },
};
/**
 * Gets the list of public option names from an options specification.
 *
 * @param optionsSpec Options specification.
 * @returns List of public option names.
 */
const getPublicOptions = (optionsSpec) => {
    return Object.keys(optionsSpec).filter((key) => {
        return optionsSpec[key].public;
    });
};
exports.getPublicOptions = getPublicOptions;
