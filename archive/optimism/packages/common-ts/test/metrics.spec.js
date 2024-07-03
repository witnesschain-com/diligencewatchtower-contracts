"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
// Setup
const chai = require("chai");
const expect = chai.expect;
const src_1 = require("../src");
describe('Metrics', () => {
    it('shoud serve metrics', async () => {
        const metrics = new src_1.LegacyMetrics({
            prefix: 'test_metrics',
        });
        const registry = metrics.registry;
        const logger = new src_1.Logger({ name: 'test_logger' });
        const server = await (0, src_1.createMetricsServer)({
            logger,
            registry,
            port: 42069,
        });
        try {
            // Create two metrics for testing
            const counter = new metrics.client.Counter({
                name: 'counter',
                help: 'counter help',
                registers: [registry],
            });
            const gauge = new metrics.client.Gauge({
                name: 'gauge',
                help: 'gauge help',
                registers: [registry],
            });
            counter.inc();
            counter.inc();
            gauge.set(100);
            // Verify that the registered metrics are served at `/`
            const response = await (0, supertest_1.default)(server).get('/metrics').send();
            expect(response.status).eq(200);
            expect(response.text).match(/counter 2/);
            expect(response.text).match(/gauge 100/);
        }
        finally {
            server.close();
            registry.clear();
        }
    });
});
