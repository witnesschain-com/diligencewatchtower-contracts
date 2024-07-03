"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.logLevels = void 0;
const pino_1 = __importDefault(require("pino"));
const pino_multi_stream_1 = __importDefault(require("pino-multi-stream"));
const pino_sentry_1 = require("pino-sentry");
exports.logLevels = [
    'trace',
    'debug',
    'info',
    'warn',
    'error',
    'fatal',
];
/**
 * Temporary wrapper class to maintain earlier module interface.
 */
class Logger {
    constructor(options) {
        this.options = options;
        const loggerOptions = {
            name: options.name,
            level: options.level || 'debug',
            // Remove pid and hostname considering production runs inside docker
            base: null,
        };
        let loggerStreams = [{ stream: process.stdout }];
        if (options.sentryOptions) {
            loggerStreams.push({
                level: 'error',
                stream: (0, pino_sentry_1.createWriteStream)({
                    ...options.sentryOptions,
                    stackAttributeKey: 'err',
                }),
            });
        }
        if (options.streams) {
            loggerStreams = loggerStreams.concat(options.streams);
        }
        this.inner = (0, pino_1.default)(loggerOptions, pino_multi_stream_1.default.multistream(loggerStreams));
    }
    child(bindings) {
        const inner = this.inner.child(bindings);
        const logger = new Logger(this.options);
        logger.inner = inner;
        return logger;
    }
    trace(msg, o, ...args) {
        if (o) {
            this.inner.trace(o, msg, ...args);
        }
        else {
            this.inner.trace(msg, ...args);
        }
    }
    debug(msg, o, ...args) {
        if (o) {
            this.inner.debug(o, msg, ...args);
        }
        else {
            this.inner.debug(msg, ...args);
        }
    }
    info(msg, o, ...args) {
        if (o) {
            this.inner.info(o, msg, ...args);
        }
        else {
            this.inner.info(msg, ...args);
        }
    }
    warn(msg, o, ...args) {
        if (o) {
            this.inner.warn(o, msg, ...args);
        }
        else {
            this.inner.warn(msg, ...args);
        }
    }
    warning(msg, o, ...args) {
        if (o) {
            this.inner.warn(o, msg, ...args);
        }
        else {
            this.inner.warn(msg, ...args);
        }
    }
    error(msg, o, ...args) {
        if (o) {
            // Formatting error log for Sentry
            const context = {
                extra: { ...o },
            };
            this.inner.error(context, msg, ...args);
        }
        else {
            this.inner.error(msg, ...args);
        }
    }
    fatal(msg, o, ...args) {
        if (o) {
            const context = {
                extra: { ...o },
            };
            this.inner.fatal(context, msg, ...args);
        }
        else {
            this.inner.fatal(msg, ...args);
        }
    }
}
exports.Logger = Logger;
