"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const glob_1 = require("glob");
/**
 * Series of function name checks.
 */
const checks = [
    {
        error: 'test name parts should be in camelCase',
        check: (parts) => {
            return parts.every((part) => {
                return part[0] === part[0].toLowerCase();
            });
        },
    },
    {
        error: 'test names should have either 3 or 4 parts, each separated by underscores',
        check: (parts) => {
            return parts.length === 3 || parts.length === 4;
        },
    },
    {
        error: 'test names should begin with "test", "testFuzz", or "testDiff"',
        check: (parts) => {
            return ['test', 'testFuzz', 'testDiff'].includes(parts[0]);
        },
    },
    {
        error: 'test names should end with either "succeeds", "reverts", "fails", "works" or "benchmark[_num]"',
        check: (parts) => {
            return (['succeeds', 'reverts', 'fails', 'benchmark', 'works'].includes(parts[parts.length - 1]) ||
                (parts[parts.length - 2] === 'benchmark' &&
                    !isNaN(parseInt(parts[parts.length - 1], 10))));
        },
    },
    {
        error: 'failure tests should have 4 parts, third part should indicate the reason for failure',
        check: (parts) => {
            return (parts.length === 4 ||
                !['reverts', 'fails'].includes(parts[parts.length - 1]));
        },
    },
];
/**
 * Script for checking that all test functions are named correctly.
 */
const main = async () => {
    const errors = [];
    const files = glob_1.glob.sync('./forge-artifacts/**/*.t.sol/*Test*.json');
    for (const file of files) {
        const artifact = JSON.parse(fs_1.default.readFileSync(file, 'utf8'));
        for (const element of artifact.abi) {
            // Skip non-functions and functions that don't start with "test".
            if (element.type !== 'function' || !element.name.startsWith('test')) {
                continue;
            }
            // Check the rest.
            for (const { check, error } of checks) {
                if (!check(element.name.split('_'))) {
                    errors.push(`in ${file} function ${element.name}: ${error}`);
                }
            }
        }
    }
    if (errors.length > 0) {
        console.error(...errors);
        process.exit(1);
    }
};
main();
