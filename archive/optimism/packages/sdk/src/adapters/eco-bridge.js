"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ECOBridgeAdapter = void 0;
/* eslint-disable @typescript-eslint/no-unused-vars */
const ethers_1 = require("ethers");
const core_utils_1 = require("@eth-optimism/core-utils");
const utils_1 = require("../utils");
const standard_bridge_1 = require("./standard-bridge");
/**
 * Bridge adapter for ECO.
 * ECO bridge requires a separate adapter as exposes different functions than our standard bridge
 */
class ECOBridgeAdapter extends standard_bridge_1.StandardBridgeAdapter {
    async supportsTokenPair(l1Token, l2Token) {
        const l1Bridge = new ethers_1.Contract(this.l1Bridge.address, [
            {
                inputs: [],
                name: 'l1Eco',
                outputs: [
                    {
                        internalType: 'address',
                        name: '',
                        type: 'address',
                    },
                ],
                stateMutability: 'view',
                type: 'function',
            },
        ], this.messenger.l1Provider);
        const l2Bridge = new ethers_1.Contract(this.l2Bridge.address, [
            {
                inputs: [],
                name: 'l2Eco',
                outputs: [
                    {
                        internalType: 'contract L2ECO',
                        name: '',
                        type: 'address',
                    },
                ],
                stateMutability: 'view',
                type: 'function',
            },
        ], this.messenger.l2Provider);
        const [remoteL1Token, remoteL2Token] = await Promise.all([
            l1Bridge.l1Eco(),
            l2Bridge.l2Eco(),
        ]);
        if (!(0, core_utils_1.hexStringEquals)(remoteL1Token, (0, utils_1.toAddress)(l1Token))) {
            return false;
        }
        if (!(0, core_utils_1.hexStringEquals)(remoteL2Token, (0, utils_1.toAddress)(l2Token))) {
            return false;
        }
        return true;
    }
}
exports.ECOBridgeAdapter = ECOBridgeAdapter;
