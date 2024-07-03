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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseServiceV2 = void 0;
const bcfg_1 = __importDefault(require("bcfg"));
const dotenv = __importStar(require("dotenv"));
const commander_1 = require("commander");
const envalid_1 = require("envalid");
const snakeCase_1 = __importDefault(require("lodash/snakeCase"));
const express_1 = __importDefault(require("express"));
const prom_client_1 = __importDefault(require("prom-client"));
const express_prom_bundle_1 = __importDefault(require("express-prom-bundle"));
const body_parser_1 = __importDefault(require("body-parser"));
const morgan_1 = __importDefault(require("morgan"));
const logger_1 = require("../common/logger");
const metrics_1 = require("./metrics");
const options_1 = require("./options");
/**
 * BaseServiceV2 is an advanced but simple base class for long-running TypeScript services.
 */
class BaseServiceV2 {
    /**
     * @param params Options for the construction of the service.
     * @param params.name Name for the service.
     * @param params.optionsSpec Settings for input options.
     * @param params.metricsSpec Settings that define which metrics are collected.
     * @param params.options Options to pass to the service.
     * @param params.loops Whether or not the service should loop. Defaults to true.
     * @param params.useEnv Whether or not to load options from the environment. Defaults to true.
     * @param params.useArgv Whether or not to load options from the command line. Defaults to true.
     */
    constructor(params) {
        this.params = params;
        this.loop = params.loop !== undefined ? params.loop : true;
        this.state = {};
        params.optionsSpec = {
            ...params.optionsSpec,
            ...options_1.stdOptionsSpec,
        };
        params.metricsSpec = {
            ...params.metricsSpec,
            ...(0, metrics_1.makeStdMetricsSpec)(params.optionsSpec),
        };
        /**
         * Special snake_case function which accounts for the common strings "L1" and "L2" which would
         * normally be split into "L_1" and "L_2" by the snake_case function.
         *
         * @param str String to convert to snake_case.
         * @returns snake_case string.
         */
        const opSnakeCase = (str) => {
            const reg = /l_1|l_2/g;
            const repl = str.includes('l1') ? 'l1' : 'l2';
            return (0, snakeCase_1.default)(str).replace(reg, repl);
        };
        // Use commander as a way to communicate info about the service. We don't actually *use*
        // commander for anything besides the ability to run `ts-node ./service.ts --help`.
        const program = new commander_1.Command().allowUnknownOption(true);
        for (const [optionName, optionSpec] of Object.entries(params.optionsSpec)) {
            // Skip options that are not meant to be used by the user.
            if (['useEnv', 'useArgv'].includes(optionName)) {
                continue;
            }
            program.addOption(new commander_1.Option(`--${optionName.toLowerCase()}`, `${optionSpec.desc}`).env(`${opSnakeCase(params.name.replace(/-/g, '_')).toUpperCase()}__${opSnakeCase(optionName).toUpperCase()}`));
        }
        const longestMetricNameLength = Object.keys(params.metricsSpec).reduce((acc, key) => {
            const nameLength = (0, snakeCase_1.default)(key).length;
            if (nameLength > acc) {
                return nameLength;
            }
            else {
                return acc;
            }
        }, 0);
        program.addHelpText('after', `\nMetrics:\n${Object.entries(params.metricsSpec)
            .map(([metricName, metricSpec]) => {
            const parsedName = opSnakeCase(metricName);
            return `  ${parsedName}${' '.repeat(longestMetricNameLength - parsedName.length + 2)}${metricSpec.desc} (type: ${metricSpec.type.name})`;
        })
            .join('\n')}
      `);
        // Load all configuration values from the environment and argv.
        program.parse();
        dotenv.config();
        const config = new bcfg_1.default(params.name);
        config.load({
            env: params.options?.useEnv ?? true,
            argv: params.options?.useEnv ?? true,
        });
        // Clean configuration values using the options spec.
        // Since BCFG turns everything into lower case, we're required to turn all of the input option
        // names into lower case for the validation step. We'll turn the names back into their original
        // names when we're done.
        const lowerCaseOptions = Object.entries(params.options).reduce((acc, [key, val]) => {
            acc[key.toLowerCase()] = val;
            return acc;
        }, {});
        const cleaned = (0, envalid_1.cleanEnv)({ ...config.env, ...config.args, ...(lowerCaseOptions || {}) }, Object.entries(params.optionsSpec || {}).reduce((acc, [key, val]) => {
            acc[key.toLowerCase()] = val.validator({
                desc: val.desc,
                default: val.default,
            });
            return acc;
        }, {}));
        // Turn the lowercased option names back into camelCase.
        this.options = Object.keys(params.optionsSpec || {}).reduce((acc, key) => {
            acc[key] = cleaned[key.toLowerCase()];
            return acc;
        }, {});
        // Make sure all options are defined.
        for (const [optionName, optionSpec] of Object.entries(params.optionsSpec)) {
            if (optionSpec.default === undefined &&
                this.options[optionName] === undefined) {
                throw new Error(`missing required option: ${optionName}`);
            }
        }
        // Create the metrics objects.
        this.metrics = Object.keys(params.metricsSpec || {}).reduce((acc, key) => {
            const spec = params.metricsSpec[key];
            acc[key] = new spec.type({
                name: `${opSnakeCase(params.name)}_${opSnakeCase(key)}`,
                help: spec.desc,
                labelNames: spec.labels || [],
            });
            return acc;
        }, {});
        // Create the metrics server.
        this.metricsRegistry = prom_client_1.default.register;
        this.port = this.options.port;
        this.hostname = this.options.hostname;
        // Set up everything else.
        this.healthy = true;
        this.loopIntervalMs = this.options.loopIntervalMs;
        this.logger = new logger_1.Logger({
            name: params.name,
            level: this.options.logLevel,
        });
        // Gracefully handle stop signals.
        const maxSignalCount = 3;
        let currSignalCount = 0;
        const stop = async (signal) => {
            // Allow exiting fast if more signals are received.
            currSignalCount++;
            if (currSignalCount === 1) {
                this.logger.info(`stopping service with signal`, { signal });
                await this.stop();
                process.exit(0);
            }
            else if (currSignalCount >= maxSignalCount) {
                this.logger.info(`performing hard stop`);
                process.exit(0);
            }
            else {
                this.logger.info(`send ${maxSignalCount - currSignalCount} more signal(s) to hard stop`);
            }
        };
        // Handle stop signals.
        process.on('SIGTERM', stop);
        process.on('SIGINT', stop);
        // Set metadata synthetic metric.
        this.metrics.metadata.set({
            name: params.name,
            version: params.version,
            ...(0, options_1.getPublicOptions)(params.optionsSpec).reduce((acc, key) => {
                if (key in options_1.stdOptionsSpec) {
                    acc[key] = this.options[key].toString();
                }
                else {
                    acc[key] = config.str(key);
                }
                return acc;
            }, {}),
        }, 1);
        // Collect default node metrics.
        prom_client_1.default.collectDefaultMetrics({
            register: this.metricsRegistry,
            labels: { name: params.name, version: params.version },
        });
    }
    /**
     * Runs the main function. If this service is set up to loop, will repeatedly loop around the
     * main function. Will also catch unhandled errors.
     */
    async run() {
        // Start the app server if not yet running.
        if (!this.server) {
            this.logger.info('starting app server');
            // Start building the app.
            const app = (0, express_1.default)();
            // Body parsing.
            app.use(body_parser_1.default.urlencoded({ extended: true }));
            // Keep the raw body around in case the application needs it.
            app.use(body_parser_1.default.json({
                verify: (req, res, buf, encoding) => {
                    ;
                    req.rawBody = buf?.toString(encoding || 'utf8') || '';
                },
                ...(this.params.bodyParserParams ?? {}),
            }));
            // Logging.
            app.use((0, morgan_1.default)('short', {
                stream: {
                    write: (str) => {
                        this.logger.info(`server log`, {
                            log: str,
                        });
                    },
                },
            }));
            // Health status.
            app.get('/healthz', async (req, res) => {
                return res.json({
                    ok: this.healthy,
                    version: this.params.version,
                });
            });
            // Register user routes.
            const router = express_1.default.Router();
            if (this.routes) {
                this.routes(router);
            }
            // Metrics.
            // Will expose a /metrics endpoint by default.
            app.use((0, express_prom_bundle_1.default)({
                promRegistry: this.metricsRegistry,
                includeMethod: true,
                includePath: true,
                includeStatusCode: true,
                normalizePath: (req) => {
                    for (const layer of router.stack) {
                        if (layer.route && req.path.match(layer.regexp)) {
                            return layer.route.path;
                        }
                    }
                    return '/invalid_path_not_a_real_route';
                },
            }));
            app.use('/api', router);
            // Wait for server to come up.
            await new Promise((resolve) => {
                this.server = app.listen(this.port, this.hostname, () => {
                    resolve(null);
                });
            });
            this.logger.info(`app server started`, {
                port: this.port,
                hostname: this.hostname,
            });
        }
        if (this.init) {
            this.logger.info('initializing service');
            await this.init();
            this.logger.info('service initialized');
        }
        if (this.loop) {
            this.logger.info('starting main loop');
            this.running = true;
            const doLoop = async () => {
                try {
                    this.mainPromise = this.main();
                    await this.mainPromise;
                }
                catch (err) {
                    this.metrics.unhandledErrors.inc();
                    this.logger.error('caught an unhandled exception', {
                        message: err.message,
                        stack: err.stack,
                        code: err.code,
                    });
                }
                // Sleep between loops if we're still running (service not stopped).
                if (this.running) {
                    this.pollingTimeout = setTimeout(doLoop, this.loopIntervalMs);
                }
            };
            doLoop();
        }
        else {
            this.logger.info('running main function');
            await this.main();
        }
    }
    /**
     * Tries to gracefully stop the service. Service will continue running until the current loop
     * iteration is finished and will then stop looping.
     */
    async stop() {
        this.logger.info('stopping main loop...');
        this.running = false;
        clearTimeout(this.pollingTimeout);
        this.logger.info('waiting for main to complete');
        // if main is in the middle of running wait for it to complete
        await this.mainPromise;
        this.logger.info('main loop stoped.');
        // Shut down the metrics server if it's running.
        if (this.server) {
            this.logger.info('stopping metrics server');
            await new Promise((resolve) => {
                this.server.close(() => {
                    resolve(null);
                });
            });
            this.logger.info('metrics server stopped');
            this.server = undefined;
        }
    }
}
exports.BaseServiceV2 = BaseServiceV2;
