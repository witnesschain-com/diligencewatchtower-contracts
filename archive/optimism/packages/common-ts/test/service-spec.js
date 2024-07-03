"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dist_1 = require("../dist");
const src_1 = require("../src");
class Service extends src_1.BaseServiceV2 {
    constructor(options) {
        super({
            name: 'test-service',
            version: '0.0',
            options,
            optionsSpec: {
                camelCase: { validator: dist_1.validators.str, desc: 'test' },
            },
            metricsSpec: {},
        });
    }
    async main() {
        /* eslint-disable @typescript-eslint/no-empty-function */
    }
}
describe('BaseServiceV2', () => {
    it('base service ctor does not throw on camel case options', async () => {
        new Service({ camelCase: 'test' });
    });
});
