"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expectApprox = exports.awaitCondition = void 0;
const chai_1 = require("chai");
const bignumber_1 = require("@ethersproject/bignumber");
const misc_1 = require("./misc");
const awaitCondition = async (cond, rate = 1000, attempts = 10) => {
    for (let i = 0; i < attempts; i++) {
        const ok = await cond();
        if (ok) {
            return;
        }
        await (0, misc_1.sleep)(rate);
    }
    throw new Error('Timed out.');
};
exports.awaitCondition = awaitCondition;
/**
 * Assert that a number lies within a custom defined range of the target.
 */
const expectApprox = (actual, target, { percentUpperDeviation, percentLowerDeviation, absoluteUpperDeviation, absoluteLowerDeviation, }) => {
    actual = bignumber_1.BigNumber.from(actual);
    target = bignumber_1.BigNumber.from(target);
    // Ensure at least one deviation parameter is defined
    const nonNullDeviations = percentUpperDeviation ||
        percentLowerDeviation ||
        absoluteUpperDeviation ||
        absoluteLowerDeviation;
    if (!nonNullDeviations) {
        throw new Error('Must define at least one parameter to limit the deviation of the actual value.');
    }
    // Upper bound calculation.
    let upper;
    // Set the two possible upper bounds if and only if they are defined.
    const upperPcnt = !percentUpperDeviation
        ? null
        : target.mul(100 + percentUpperDeviation).div(100);
    const upperAbs = !absoluteUpperDeviation
        ? null
        : target.add(absoluteUpperDeviation);
    if (upperPcnt && upperAbs) {
        // If both are set, take the lesser of the two upper bounds.
        upper = upperPcnt.lte(upperAbs) ? upperPcnt : upperAbs;
    }
    else {
        // Else take whichever is not undefined or set to null.
        upper = upperPcnt || upperAbs;
    }
    // Lower bound calculation.
    let lower;
    // Set the two possible lower bounds if and only if they are defined.
    const lowerPcnt = !percentLowerDeviation
        ? null
        : target.mul(100 - percentLowerDeviation).div(100);
    const lowerAbs = !absoluteLowerDeviation
        ? null
        : target.sub(absoluteLowerDeviation);
    if (lowerPcnt && lowerAbs) {
        // If both are set, take the greater of the two lower bounds.
        lower = lowerPcnt.gte(lowerAbs) ? lowerPcnt : lowerAbs;
    }
    else {
        // Else take whichever is not undefined or set to null.
        lower = lowerPcnt || lowerAbs;
    }
    // Apply the assertions if they are non-null.
    if (upper) {
        (0, chai_1.expect)(actual.lte(upper), `Actual value (${actual}) is greater than the calculated upper bound of (${upper})`).to.be.true;
    }
    if (lower) {
        (0, chai_1.expect)(actual.gte(lower), `Actual value (${actual}) is less than the calculated lower bound of (${lower})`).to.be.true;
    }
};
exports.expectApprox = expectApprox;
