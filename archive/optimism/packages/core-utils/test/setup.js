"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mocha = exports.expect = exports.should = void 0;
/* External Imports */
const chai = require("chai");
const mocha_1 = __importDefault(require("mocha"));
exports.Mocha = mocha_1.default;
const should = chai.should();
exports.should = should;
const expect = chai.expect;
exports.expect = expect;
