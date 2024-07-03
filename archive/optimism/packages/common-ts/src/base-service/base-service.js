"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseService = void 0;
/* Imports: Internal */
const logger_1 = require("../common/logger");
/**
 * Base for other "Service" objects. Handles your standard initialization process, can dynamically
 * start and stop.
 */
class BaseService {
    constructor(name, options, optionSettings) {
        this.initialized = false;
        this.running = false;
        validateOptions(options, optionSettings);
        this.name = name;
        this.options = mergeDefaultOptions(options, optionSettings);
        this.logger = options.logger || new logger_1.Logger({ name });
        if (options.metrics) {
            this.metrics = options.metrics;
        }
    }
    /**
     * Initializes the service.
     */
    async init() {
        if (this.initialized) {
            return;
        }
        this.logger.info('Service is initializing...');
        await this._init();
        this.logger.info('Service has initialized.');
        this.initialized = true;
    }
    /**
     * Starts the service (initializes it if needed).
     */
    async start() {
        if (this.running) {
            return;
        }
        this.logger.info('Service is starting...');
        await this.init();
        // set the service to running
        this.running = true;
        await this._start();
        this.logger.info('Service has started');
    }
    /**
     * Stops the service.
     */
    async stop() {
        if (!this.running) {
            return;
        }
        this.logger.info('Service is stopping...');
        await this._stop();
        this.logger.info('Service has stopped');
        this.running = false;
    }
    /**
     * Internal init function. Parent should implement.
     */
    async _init() {
        return;
    }
    /**
     * Internal start function. Parent should implement.
     */
    async _start() {
        return;
    }
    /**
     * Internal stop function. Parent should implement.
     */
    async _stop() {
        return;
    }
}
exports.BaseService = BaseService;
/**
 * Combines user provided and default options.
 */
const mergeDefaultOptions = (options, optionSettings) => {
    for (const optionName of Object.keys(optionSettings)) {
        const optionDefault = optionSettings[optionName].default;
        if (optionDefault === undefined) {
            continue;
        }
        if (options[optionName] !== undefined && options[optionName] !== null) {
            continue;
        }
        options[optionName] = optionDefault;
    }
    return options;
};
/**
 * Performs option validation against the option settings
 */
const validateOptions = (options, optionSettings) => {
    for (const optionName of Object.keys(optionSettings)) {
        const optionValidationFunction = optionSettings[optionName].validate;
        if (optionValidationFunction === undefined) {
            continue;
        }
        const optionValue = options[optionName];
        if (optionValidationFunction(optionValue) === false) {
            throw new Error(`Provided input for option "${optionName}" is invalid: ${optionValue}`);
        }
    }
};
