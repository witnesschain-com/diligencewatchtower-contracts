"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BalanceMonService = void 0;
const common_ts_1 = require("@eth-optimism/common-ts");
const package_json_1 = require("../../package.json");
class BalanceMonService extends common_ts_1.BaseServiceV2 {
    constructor(options) {
        super({
            version: package_json_1.version,
            name: 'balance-mon',
            loop: true,
            options: {
                loopIntervalMs: 60000,
                ...options,
            },
            optionsSpec: {
                rpc: {
                    validator: common_ts_1.validators.provider,
                    desc: 'Provider for network to monitor balances on',
                },
                accounts: {
                    validator: common_ts_1.validators.str,
                    desc: 'JSON array of [{ address, nickname }] to monitor balances of',
                    public: true,
                },
            },
            metricsSpec: {
                balances: {
                    type: common_ts_1.Gauge,
                    desc: 'Balances of addresses',
                    labels: ['address', 'nickname'],
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
        this.state.accounts = JSON.parse(this.options.accounts);
    }
    async main() {
        for (const account of this.state.accounts) {
            let balance;
            try {
                balance = await this.options.rpc.getBalance(account.address);
            }
            catch (err) {
                this.logger.info(`got unexpected RPC error`, {
                    section: 'balances',
                    name: 'getBalance',
                    err,
                });
                this.metrics.unexpectedRpcErrors.inc({
                    section: 'balances',
                    name: 'getBalance',
                });
                continue;
            }
            this.logger.info(`got balance`, {
                address: account.address,
                nickname: account.nickname,
                balance: balance.toString(),
            });
            // Parse the balance as an integer instead of via toNumber() to avoid ethers throwing an
            // an error. We might get rounding errors but we don't need perfect precision here, just a
            // generally accurate sense for what the current balance is.
            this.metrics.balances.set({ address: account.address, nickname: account.nickname }, parseInt(balance.toString(), 10));
        }
    }
}
exports.BalanceMonService = BalanceMonService;
if (require.main === module) {
    const service = new BalanceMonService();
    service.run();
}
