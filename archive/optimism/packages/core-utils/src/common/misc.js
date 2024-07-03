"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareAddrs = exports.getenv = exports.reqenv = exports.clone = exports.sleep = void 0;
/**
 * Basic timeout-based async sleep function.
 *
 * @param ms Number of milliseconds to sleep.
 */
const sleep = async (ms) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(null);
        }, ms);
    });
};
exports.sleep = sleep;
/**
 * Returns a clone of the object.
 *
 * @param obj Object to clone.
 * @returns Clone of the object.
 */
const clone = (obj) => {
    if (typeof obj === 'undefined') {
        throw new Error(`Trying to clone undefined object`);
    }
    return { ...obj };
};
exports.clone = clone;
/**
 * Loads a variable from the environment and throws if the variable is not defined.
 *
 * @param name Name of the variable to load.
 * @returns Value of the variable as a string.
 */
const reqenv = (name) => {
    const value = process.env[name];
    if (value === undefined) {
        throw new Error(`missing env var ${name}`);
    }
    return value;
};
exports.reqenv = reqenv;
/**
 * Loads a variable from the environment and returns a fallback if not found.
 *
 * @param name Name of the variable to load.
 * @param [fallback] Optional value to be returned as fallback.
 * @returns Value of the variable as a string, fallback or undefined.
 */
const getenv = (name, fallback) => {
    return process.env[name] || fallback;
};
exports.getenv = getenv;
/**
 * Returns true if the given string is a valid address.
 *
 * @param a First address to check.
 * @param b Second address to check.
 * @returns True if the given addresses match.
 */
const compareAddrs = (a, b) => {
    return a.toLowerCase() === b.toLowerCase();
};
exports.compareAddrs = compareAddrs;
