"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configSpec = void 0;
/**
 * Specification for each of the configuration options.
 */
exports.configSpec = {
    ddd: {
        type: 'address',
    },
    numDeployConfirmations: {
        type: 'number',
        default: 1,
    },
    optimistName: {
        type: 'string',
        default: 'Optimist',
    },
    optimistSymbol: {
        type: 'string',
        default: 'OPTIMIST',
    },
    optimistBaseUriAttestorAddress: {
        type: 'address',
    },
    optimistInviterInviteGranter: {
        type: 'address',
    },
    optimistInviterName: {
        type: 'string',
    },
    optimistAllowlistAllowlistAttestor: {
        type: 'address',
    },
    optimistAllowlistCoinbaseQuestAttestor: {
        type: 'address',
    },
    l2ProxyOwnerAddress: {
        type: 'address',
    },
};
