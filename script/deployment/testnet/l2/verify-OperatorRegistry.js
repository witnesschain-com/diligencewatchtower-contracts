"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAsProxy = void 0;
//import { getContractAddress } from "./getContractAddress";
function verifyAsProxy(hre, contractName) {
    return __awaiter(this, void 0, void 0, function () {
        var chainID, networkName, e_1, err;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    chainID = hre.network.config.chainId ? hre.network.config.chainId : 0;
                    networkName = hre.network.name;
                    //const contractAddressProxy = await getContractAddress(chainID, networkName, contractName);
                    // Сhecking the correctness of the address

                    if (!hre.ethers.isAddress("0x26710e60A36Ace8A44e1C3D7B33dc8B80eAb6cb7")) {
                      throw new Error(`Error invalid contract proxy address ${contractAddressProxy}`);
                    } 
                    console.log("Verifying contract ${contractName} with address proxy ${contractAddressProxy} on ${hre.network.name} network");
                    console.log("-- VERIFY proxy");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, hre.run("verify:verify", {
                            address: "0x26710e60A36Ace8A44e1C3D7B33dc8B80eAb6cb7",
                            //constructorArguments: ["0xA44151489861Fe9e3055d95adC98FbD462B948e7","0xcAe751b75833ef09627549868A04E32679386e7C"],
                        })];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _a.sent();
                    err = e_1;
                    console.error("Error occurred while proxy verify:", err.message);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
const hre = require("hardhat");
exports.verifyAsProxy = verifyAsProxy;
verifyAsProxy(hre,"OperatorRegistry");
// npx hardhat run script/deployment/testnet/l2/verify-OperatorRegistry.js --network blue-orangutan
