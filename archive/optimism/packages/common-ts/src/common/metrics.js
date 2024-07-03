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
exports.createMetricsServer = exports.LegacyMetrics = void 0;
const prom_client_1 = __importStar(require("prom-client"));
const express_1 = __importDefault(require("express"));
class LegacyMetrics {
    constructor(options) {
        this.options = options;
        const metricsOptions = {
            prefix: options.prefix,
            labels: options.labels,
        };
        this.client = prom_client_1.default;
        this.registry = prom_client_1.default.register;
        // Collect default metrics (event loop lag, memory, file descriptors etc.)
        (0, prom_client_1.collectDefaultMetrics)(metricsOptions);
    }
}
exports.LegacyMetrics = LegacyMetrics;
const createMetricsServer = async (options) => {
    const logger = options.logger.child({ component: 'MetricsServer' });
    const app = (0, express_1.default)();
    const route = options.route || '/metrics';
    app.get(route, async (_, res) => {
        res.status(200).send(await options.registry.metrics());
    });
    const port = options.port || 7300;
    const hostname = options.hostname || '0.0.0.0';
    const server = app.listen(port, hostname, () => {
        logger.info('Metrics server started', {
            port,
            hostname,
            route,
        });
    });
    return server;
};
exports.createMetricsServer = createMetricsServer;
