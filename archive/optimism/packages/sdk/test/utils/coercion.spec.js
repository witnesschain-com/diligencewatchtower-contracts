"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const abstract_provider_1 = require("@ethersproject/abstract-provider");
const hardhat_1 = require("hardhat");
const setup_1 = require("../setup");
const src_1 = require("../../src");
describe('type coercion utils', () => {
    describe('toSignerOrProvider', () => {
        it('should convert a string to a JsonRpcProvider', () => {
            const provider = (0, src_1.toSignerOrProvider)('http://localhost:8545');
            (0, setup_1.expect)(abstract_provider_1.Provider.isProvider(provider)).to.be.true;
        });
        it('should not do anything with a provider', () => {
            const provider = (0, src_1.toSignerOrProvider)(hardhat_1.ethers.provider);
            (0, setup_1.expect)(provider).to.deep.equal(hardhat_1.ethers.provider);
        });
    });
    describe('toTransactionHash', () => {
        describe('string inputs', () => {
            it('should return the input if the input is a valid transaction hash', () => {
                const input = '0x' + '11'.repeat(32);
                (0, setup_1.expect)((0, src_1.toTransactionHash)(input)).to.equal(input);
            });
            it('should throw an error if the input is a hex string but not a transaction hash', () => {
                const input = '0x' + '11'.repeat(31);
                (0, setup_1.expect)(() => (0, src_1.toTransactionHash)(input)).to.throw('Invalid transaction hash');
            });
            it('should throw an error if the input is not a hex string', () => {
                const input = 'hi mom look at me go';
                (0, setup_1.expect)(() => (0, src_1.toTransactionHash)(input)).to.throw('Invalid transaction hash');
            });
        });
        describe('transaction inputs', () => {
            let AbsolutelyNothing;
            before(async () => {
                AbsolutelyNothing = (await (await hardhat_1.ethers.getContractFactory('AbsolutelyNothing')).deploy());
            });
            it('should return the transaction hash if the input is a transaction response', async () => {
                const tx = await AbsolutelyNothing.doAbsolutelyNothing();
                (0, setup_1.expect)((0, src_1.toTransactionHash)(tx)).to.equal(tx.hash);
            });
            it('should return the transaction hash if the input is a transaction receipt', async () => {
                const tx = await AbsolutelyNothing.doAbsolutelyNothing();
                const receipt = await tx.wait();
                (0, setup_1.expect)((0, src_1.toTransactionHash)(receipt)).to.equal(receipt.transactionHash);
            });
        });
        describe('other types', () => {
            it('should throw if given a number as an input', () => {
                (0, setup_1.expect)(() => (0, src_1.toTransactionHash)(1234)).to.throw('Invalid transaction');
            });
            it('should throw if given a function as an input', () => {
                (0, setup_1.expect)(() => (0, src_1.toTransactionHash)((() => {
                    return 1234;
                }))).to.throw('Invalid transaction');
            });
        });
    });
});
