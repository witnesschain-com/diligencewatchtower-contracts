"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitForProvider = void 0;
const core_utils_1 = require("@eth-optimism/core-utils");
/**
 * Waits for an Ethers provider to be connected.
 *
 * @param provider Ethers provider to check.
 * @param opts Options for the function.
 * @param opts.logger Logger to use.
 * @param opts.intervalMs Interval to wait between checks.
 * @param opts.name Name of the provider for logs.
 */
const waitForProvider = async (provider, opts) => {
    const name = opts?.name || 'target';
    opts?.logger?.info(`waiting for ${name} provider...`);
    let connected = false;
    while (!connected) {
        try {
            await provider.getBlockNumber();
            connected = true;
        }
        catch (e) {
            opts?.logger?.info(`${name} provider not connected, retrying...`);
            await (0, core_utils_1.sleep)(opts?.intervalMs || 15000);
        }
    }
    opts?.logger?.info(`${name} provider connected`);
};
exports.waitForProvider = waitForProvider;
