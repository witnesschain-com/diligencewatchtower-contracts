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
exports.DrippieMonService = void 0;
const common_ts_1 = require("@eth-optimism/common-ts");
const ethers_1 = require("ethers");
const DrippieArtifact = __importStar(require("@eth-optimism/contracts-periphery/artifacts/contracts/universal/drippie/Drippie.sol/Drippie.json"));
const package_json_1 = require("../../package.json");
class DrippieMonService extends common_ts_1.BaseServiceV2 {
    constructor(options) {
        super({
            version: package_json_1.version,
            name: 'drippie-mon',
            loop: true,
            options: {
                loopIntervalMs: 60000,
                ...options,
            },
            optionsSpec: {
                rpc: {
                    validator: common_ts_1.validators.provider,
                    desc: 'Provider for network where Drippie is deployed',
                },
                drippieAddress: {
                    validator: common_ts_1.validators.str,
                    desc: 'Address of Drippie contract',
                    public: true,
                },
            },
            metricsSpec: {
                isExecutable: {
                    type: common_ts_1.Gauge,
                    desc: 'Whether or not the drip is currently executable',
                    labels: ['name'],
                },
                executedDripCount: {
                    type: common_ts_1.Gauge,
                    desc: 'Number of times a drip has been executed',
                    labels: ['name'],
                },
                unexpectedRpcErrors: {
                    type: common_ts_1.Counter,
                    desc: 'Number of unexpected RPC errors',
                    labels: ['section', 'name'],
                },
            },
        });
    }
    async init() {
        this.state.drippie = new ethers_1.ethers.Contract(this.options.drippieAddress, DrippieArtifact.abi, this.options.rpc);
    }
    async main() {
        let dripCreatedEvents;
        try {
            dripCreatedEvents = await this.state.drippie.queryFilter(this.state.drippie.filters.DripCreated());
        }
        catch (err) {
            this.logger.info(`got unexpected RPC error`, {
                section: 'creations',
                name: 'NULL',
                err,
            });
            this.metrics.unexpectedRpcErrors.inc({
                section: 'creations',
                name: 'NULL',
            });
            return;
        }
        // Not the most efficient thing in the world. Will end up making one request for every drip
        // created. We don't expect there to be many drips, so this is fine for now. We can also cache
        // and skip any archived drips to cut down on a few requests. Worth keeping an eye on this to
        // see if it's a bottleneck.
        for (const event of dripCreatedEvents) {
            const name = event.args.name;
            let drip;
            try {
                drip = await this.state.drippie.drips(name);
            }
            catch (err) {
                this.logger.info(`got unexpected RPC error`, {
                    section: 'drips',
                    name,
                    err,
                });
                this.metrics.unexpectedRpcErrors.inc({
                    section: 'drips',
                    name,
                });
                continue;
            }
            this.logger.info(`getting drip executable status`, {
                name,
                count: drip.count.toNumber(),
            });
            this.metrics.executedDripCount.set({
                name,
            }, drip.count.toNumber());
            let executable;
            try {
                // To avoid making unnecessary RPC requests, filter out any drips that we don't expect to
                // be executable right now. Only active drips (status = 2) and drips that are due to be
                // executed are expected to be executable (but might not be based on the dripcheck).
                if (drip.status === 2 &&
                    drip.last.toNumber() + drip.config.interval.toNumber() <
                        Date.now() / 1000) {
                    executable = await this.state.drippie.executable(name);
                }
                else {
                    executable = false;
                }
            }
            catch (err) {
                // All reverts include the string "Drippie:", so we can check for that.
                if (err.message.includes('Drippie:')) {
                    // Not executable yet.
                    executable = false;
                }
                else {
                    this.logger.info(`got unexpected RPC error`, {
                        section: 'executable',
                        name,
                        err,
                    });
                    this.metrics.unexpectedRpcErrors.inc({
                        section: 'executable',
                        name,
                    });
                    continue;
                }
            }
            this.logger.info(`got drip executable status`, {
                name,
                executable,
            });
            this.metrics.isExecutable.set({
                name,
            }, executable ? 1 : 0);
        }
    }
}
exports.DrippieMonService = DrippieMonService;
if (require.main === module) {
    const service = new DrippieMonService();
    service.run();
}
