"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const setup_1 = require("../setup");
const src_1 = require("../../src");
describe('address aliasing utils', () => {
    describe('applyL1ToL2Alias', () => {
        it('should be able to apply the alias to a valid address', () => {
            (0, setup_1.expect)((0, src_1.applyL1ToL2Alias)('0x0000000000000000000000000000000000000000')).to.equal('0x1111000000000000000000000000000000001111');
        });
        it('should be able to apply the alias even if the operation overflows', () => {
            (0, setup_1.expect)((0, src_1.applyL1ToL2Alias)('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF')).to.equal('0x1111000000000000000000000000000000001110');
        });
        it('should throw if the input is not a valid address', () => {
            (0, setup_1.expect)(() => {
                (0, src_1.applyL1ToL2Alias)('0x1234');
            }).to.throw('not a valid address: 0x1234');
        });
    });
    describe('undoL1ToL2Alias', () => {
        it('should be able to undo the alias from a valid address', () => {
            (0, setup_1.expect)((0, src_1.undoL1ToL2Alias)('0x1111000000000000000000000000000000001111')).to.equal('0x0000000000000000000000000000000000000000');
        });
        it('should be able to undo the alias even if the operation underflows', () => {
            (0, setup_1.expect)((0, src_1.undoL1ToL2Alias)('0x1111000000000000000000000000000000001110')).to.equal('0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF');
        });
        it('should throw if the input is not a valid address', () => {
            (0, setup_1.expect)(() => {
                (0, src_1.undoL1ToL2Alias)('0x1234');
            }).to.throw('not a valid address: 0x1234');
        });
    });
});
