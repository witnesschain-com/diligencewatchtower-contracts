"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Etherscan = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const networks = {
    1: {
        chainId: 1,
        names: ['mainnet', 'main', 'eth', 'ethereum'],
        etherscanApiUrl: 'https://api.etherscan.io',
    },
    3: {
        chainId: 3,
        names: ['ropsten'],
        etherscanApiUrl: 'https://api-ropsten.etherscan.io',
    },
    4: {
        chainId: 4,
        names: ['rinkeby'],
        etherscanApiUrl: 'https://api-rinkeby.etherscan.io',
    },
    5: {
        chainId: 5,
        names: ['goerli'],
        etherscanApiUrl: 'https://api-goerli.etherscan.io',
    },
    10: {
        chainId: 10,
        names: ['optimism'],
        etherscanApiUrl: 'https://api-optimistic.etherscan.io',
    },
    42: {
        chainId: 42,
        names: ['kovan'],
        etherscanApiUrl: 'https://api-kovan.etherscan.io',
    },
    69: {
        chainId: 69,
        names: ['opkovan', 'kovan-optimism', 'optimistic-kovan'],
        etherscanApiUrl: 'https://api-kovan-optimistic.etherscan.io',
    },
};
class Etherscan {
    constructor(apiKey, network) {
        this.apiKey = apiKey;
        this.network = network;
        if (typeof network === 'string') {
            this.net = Object.values(networks).find((net) => {
                return net.names.includes(network);
            });
        }
        else {
            this.net = networks[this.network];
        }
    }
    async getContractSource(address) {
        const url = new URL(`${this.net.etherscanApiUrl}/api`);
        url.searchParams.append('module', 'contract');
        url.searchParams.append('action', 'getsourcecode');
        url.searchParams.append('address', address);
        url.searchParams.append('apikey', this.apiKey);
        const response = await (0, node_fetch_1.default)(url);
        const result = await response.json();
        return result.result[0];
    }
    async getContractABI(address) {
        const source = await this.getContractSource(address);
        if (source.Proxy === '1') {
            const impl = await this.getContractSource(source.Implementation);
            return impl.ABI;
        }
        else {
            return source.ABI;
        }
    }
}
exports.Etherscan = Etherscan;
