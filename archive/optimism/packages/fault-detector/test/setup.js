"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expect = exports.should = void 0;
const chai = require("chai");
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
// Chai plugins go here.
chai.use(chai_as_promised_1.default);
const should = chai.should();
exports.should = should;
const expect = chai.expect;
exports.expect = expect;
