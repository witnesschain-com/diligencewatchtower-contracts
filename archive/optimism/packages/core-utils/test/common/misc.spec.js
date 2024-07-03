"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* Imports: Internal */
const setup_1 = require("../setup");
const src_1 = require("../../src");
describe('sleep', async () => {
    it('should return wait input amount of ms', async () => {
        const startTime = Date.now();
        await (0, src_1.sleep)(1000);
        const endTime = Date.now();
        (0, setup_1.expect)(startTime + 1000 <= endTime).to.deep.equal(true);
    });
});
describe('clone', async () => {
    it('should return a cloned object', async () => {
        const exampleObject = { example: 'Example' };
        const clonedObject = (0, src_1.clone)(exampleObject);
        (0, setup_1.expect)(clonedObject).to.not.equal(exampleObject);
        (0, setup_1.expect)(JSON.stringify(clonedObject)).to.equal(JSON.stringify(exampleObject));
    });
});
describe('reqenv', async () => {
    let cachedEnvironment;
    const temporaryEnvironmentKey = 'testVariable';
    const temporaryEnvironment = {
        [temporaryEnvironmentKey]: 'This is an environment variable',
    };
    before(() => {
        cachedEnvironment = process.env;
        process.env = temporaryEnvironment;
    });
    it('should return an existent environment variable', async () => {
        const requiredEnvironmentValue = (0, src_1.reqenv)(temporaryEnvironmentKey);
        (0, setup_1.expect)(requiredEnvironmentValue).to.equal(temporaryEnvironment[temporaryEnvironmentKey]);
    });
    it('should throw an error trying to return a variable that does not exist', async () => {
        const undeclaredVariableName = 'undeclaredVariable';
        const failedReqenv = () => (0, src_1.reqenv)(undeclaredVariableName);
        (0, setup_1.expect)(failedReqenv).to.throw();
    });
    after(() => {
        process.env = cachedEnvironment;
    });
});
describe('getenv', async () => {
    let cachedEnvironment;
    const temporaryEnvironmentKey = 'testVariable';
    const temporaryEnvironment = {
        [temporaryEnvironmentKey]: 'This is an environment variable',
    };
    const fallback = 'fallback';
    before(() => {
        cachedEnvironment = process.env;
        process.env = temporaryEnvironment;
    });
    it('should return an existent environment variable', async () => {
        const environmentVariable = (0, src_1.getenv)(temporaryEnvironmentKey);
        (0, setup_1.expect)(environmentVariable).to.equal(temporaryEnvironment[temporaryEnvironmentKey]);
    });
    it('should return an existent environment variable even if fallback is passed', async () => {
        const environmentVariable = (0, src_1.getenv)(temporaryEnvironmentKey, fallback);
        (0, setup_1.expect)(environmentVariable).to.equal(temporaryEnvironment[temporaryEnvironmentKey]);
    });
    it('should return fallback if variable is not defined', async () => {
        const undeclaredVariableName = 'undeclaredVariable';
        (0, setup_1.expect)((0, src_1.getenv)(undeclaredVariableName, fallback)).to.equal(fallback);
    });
    it('should return undefined if no fallback is passed and variable is not defined', async () => {
        (0, setup_1.expect)((0, src_1.getenv)('undeclaredVariable')).to.be.undefined;
    });
    after(() => {
        process.env = cachedEnvironment;
    });
});
