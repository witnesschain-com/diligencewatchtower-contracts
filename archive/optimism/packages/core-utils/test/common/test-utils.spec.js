"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
/* Imports: Internal */
const setup_1 = require("../setup");
const src_1 = require("../../src");
describe('awaitCondition', () => {
    it('should try the condition fn until it returns true', async () => {
        let i = 0;
        const condFn = async () => {
            i++;
            return Promise.resolve(i === 2);
        };
        await (0, src_1.awaitCondition)(condFn, 50, 3);
        (0, setup_1.expect)(i).to.equal(2);
    });
    it('should only try the configured number of attempts', async () => {
        let i = 0;
        const condFn = async () => {
            i++;
            return Promise.resolve(i === 2);
        };
        try {
            await (0, src_1.awaitCondition)(condFn, 50, 1);
        }
        catch (e) {
            return;
        }
        chai_1.assert.fail('Condition never failed, but it should have.');
    });
});
describe('expectApprox', () => {
    it('should pass when the actual number is higher, but within the expected range of the target', async () => {
        (0, src_1.expectApprox)(119, 100, {
            percentUpperDeviation: 20,
            percentLowerDeviation: 20,
            absoluteUpperDeviation: 20,
            absoluteLowerDeviation: 20,
        });
    });
    it('should pass when the actual number is lower, but within the expected range of the target', async () => {
        (0, src_1.expectApprox)(81, 100, {
            percentUpperDeviation: 20,
            percentLowerDeviation: 20,
            absoluteUpperDeviation: 20,
            absoluteLowerDeviation: 20,
        });
    });
    it('should throw an error when no deviation values are given', async () => {
        try {
            (0, src_1.expectApprox)(101, 100, {});
            chai_1.assert.fail('expectApprox did not throw an error');
        }
        catch (error) {
            (0, setup_1.expect)(error.message).to.equal('Must define at least one parameter to limit the deviation of the actual value.');
        }
    });
    describe('should throw an error if the actual value is higher than expected', () => {
        describe('... when only one upper bound value is defined', () => {
            it('... and percentUpperDeviation sets the upper bound', async () => {
                try {
                    (0, src_1.expectApprox)(121, 100, {
                        percentUpperDeviation: 20,
                    });
                    chai_1.assert.fail('expectApprox did not throw an error');
                }
                catch (error) {
                    (0, setup_1.expect)(error.message).to.equal('Actual value (121) is greater than the calculated upper bound of (120): expected false to be true');
                }
            });
            it('... and absoluteUpperDeviation sets the upper bound', async () => {
                try {
                    (0, src_1.expectApprox)(121, 100, {
                        absoluteUpperDeviation: 20,
                    });
                    chai_1.assert.fail('expectApprox did not throw an error');
                }
                catch (error) {
                    (0, setup_1.expect)(error.message).to.equal('Actual value (121) is greater than the calculated upper bound of (120): expected false to be true');
                }
            });
        });
        describe('... when both values are defined', () => {
            it('... and percentUpperDeviation sets the upper bound', async () => {
                try {
                    (0, src_1.expectApprox)(121, 100, {
                        percentUpperDeviation: 20,
                        absoluteUpperDeviation: 30,
                    });
                    chai_1.assert.fail('expectApprox did not throw an error');
                }
                catch (error) {
                    (0, setup_1.expect)(error.message).to.equal('Actual value (121) is greater than the calculated upper bound of (120): expected false to be true');
                }
            });
            it('... and absoluteUpperDeviation sets the upper bound', async () => {
                try {
                    (0, src_1.expectApprox)(121, 100, {
                        percentUpperDeviation: 30,
                        absoluteUpperDeviation: 20,
                    });
                    chai_1.assert.fail('expectApprox did not throw an error');
                }
                catch (error) {
                    (0, setup_1.expect)(error.message).to.equal('Actual value (121) is greater than the calculated upper bound of (120): expected false to be true');
                }
            });
        });
    });
    describe('should throw an error if the actual value is lower than expected', () => {
        describe('... when only one lower bound value is defined', () => {
            it('... and percentLowerDeviation sets the lower bound', async () => {
                try {
                    (0, src_1.expectApprox)(79, 100, {
                        percentLowerDeviation: 20,
                    });
                    chai_1.assert.fail('expectApprox did not throw an error');
                }
                catch (error) {
                    (0, setup_1.expect)(error.message).to.equal('Actual value (79) is less than the calculated lower bound of (80): expected false to be true');
                }
            });
            it('... and absoluteLowerDeviation sets the lower bound', async () => {
                try {
                    (0, src_1.expectApprox)(79, 100, {
                        absoluteLowerDeviation: 20,
                    });
                    chai_1.assert.fail('expectApprox did not throw an error');
                }
                catch (error) {
                    (0, setup_1.expect)(error.message).to.equal('Actual value (79) is less than the calculated lower bound of (80): expected false to be true');
                }
            });
        });
        describe('... when both values are defined', () => {
            it('... and percentLowerDeviation sets the lower bound', async () => {
                try {
                    (0, src_1.expectApprox)(79, 100, {
                        percentLowerDeviation: 20,
                        absoluteLowerDeviation: 30,
                    });
                    chai_1.assert.fail('expectApprox did not throw an error');
                }
                catch (error) {
                    (0, setup_1.expect)(error.message).to.equal('Actual value (79) is less than the calculated lower bound of (80): expected false to be true');
                }
            });
            it('... and absoluteLowerDeviation sets the lower bound', async () => {
                try {
                    (0, src_1.expectApprox)(79, 100, {
                        percentLowerDeviation: 30,
                        absoluteLowerDeviation: 20,
                    });
                    chai_1.assert.fail('expectApprox did not throw an error');
                }
                catch (error) {
                    (0, setup_1.expect)(error.message).to.equal('Actual value (79) is less than the calculated lower bound of (80): expected false to be true');
                }
            });
        });
    });
});
