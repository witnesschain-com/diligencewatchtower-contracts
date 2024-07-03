"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("../setup");
const bignumber_1 = require("@ethersproject/bignumber");
const src_1 = require("../../src");
describe('Fees', () => {
    it('should count zeros and ones', () => {
        const cases = [
            { input: Buffer.from('0001', 'hex'), zeros: 1, ones: 1 },
            { input: '0x0001', zeros: 1, ones: 1 },
            { input: '0x', zeros: 0, ones: 0 },
            { input: '0x1111', zeros: 0, ones: 2 },
        ];
        for (const test of cases) {
            const [zeros, ones] = (0, src_1.zeroesAndOnes)(test.input);
            zeros.should.eq(test.zeros);
            ones.should.eq(test.ones);
        }
    });
    it('should compute calldata costs', () => {
        const cases = [
            { input: '0x', output: bignumber_1.BigNumber.from(0) },
            { input: '0x00', output: bignumber_1.BigNumber.from(4) },
            { input: '0xff', output: bignumber_1.BigNumber.from(16) },
            { input: Buffer.alloc(32), output: bignumber_1.BigNumber.from(4 * 32) },
            { input: Buffer.alloc(32, 0xff), output: bignumber_1.BigNumber.from(16 * 32) },
        ];
        for (const test of cases) {
            const cost = (0, src_1.calldataCost)(test.input);
            cost.should.deep.eq(test.output);
        }
    });
});
