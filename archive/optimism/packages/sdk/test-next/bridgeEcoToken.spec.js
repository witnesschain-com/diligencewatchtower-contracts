"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = __importDefault(require("ethers"));
const vitest_1 = require("vitest");
const viem_1 = require("viem");
const viemClients_1 = require("./testUtils/viemClients");
const src_1 = require("../src");
const ethersProviders_1 = require("./testUtils/ethersProviders");
const ECO_WHALE = '0x982E148216E3Aa6B38f9D901eF578B5c06DD7502';
// we should instead use tokenlist as source of truth
const ECO_L1_TOKEN_ADDRESS = '0x3E87d4d9E69163E7590f9b39a70853cf25e5ABE3';
const ECO_L2_TOKEN_ADDRESS = '0xD2f598c826429EEe7c071C02735549aCd88F2c09';
const getERC20TokenBalance = async (publicClient, tokenAddress, ownerAddress) => {
    const result = await publicClient.readContract({
        address: tokenAddress,
        abi: [
            {
                inputs: [{ name: 'owner', type: 'address' }],
                name: 'balanceOf',
                outputs: [{ name: '', type: 'uint256' }],
                stateMutability: 'view',
                type: 'function',
            },
        ],
        functionName: 'balanceOf',
        args: [ownerAddress],
    });
    return result;
};
const getL1ERC20TokenBalance = async (ownerAddress) => {
    return getERC20TokenBalance(viemClients_1.l1PublicClient, ECO_L1_TOKEN_ADDRESS, ownerAddress);
};
const getL2ERC20TokenBalance = async (ownerAddress) => {
    return getERC20TokenBalance(viemClients_1.l2PublicClient, ECO_L2_TOKEN_ADDRESS, ownerAddress);
};
(0, vitest_1.describe)('ECO token', () => {
    (0, vitest_1.it)('sdk should be able to deposit to l1 bridge contract correctly', async () => {
        await viemClients_1.l1TestClient.impersonateAccount({ address: ECO_WHALE });
        const l1EcoWhaleSigner = await ethersProviders_1.l1Provider.getSigner(ECO_WHALE);
        const preBridgeL1EcoWhaleBalance = await getL1ERC20TokenBalance(ECO_WHALE);
        const crossChainMessenger = new src_1.CrossChainMessenger({
            l1SignerOrProvider: l1EcoWhaleSigner,
            l2SignerOrProvider: ethersProviders_1.l2Provider,
            l1ChainId: 5,
            l2ChainId: 420,
            bedrock: true,
            bridges: src_1.BRIDGE_ADAPTER_DATA[src_1.L2ChainID.OPTIMISM_GOERLI],
        });
        await crossChainMessenger.approveERC20(ECO_L1_TOKEN_ADDRESS, ECO_L2_TOKEN_ADDRESS, ethers_1.default.utils.parseEther('0.1'));
        const txResponse = await crossChainMessenger.depositERC20(ECO_L1_TOKEN_ADDRESS, ECO_L2_TOKEN_ADDRESS, ethers_1.default.utils.parseEther('0.1'));
        await txResponse.wait();
        const l1EcoWhaleBalance = await getL1ERC20TokenBalance(ECO_WHALE);
        (0, vitest_1.expect)(l1EcoWhaleBalance).toEqual(preBridgeL1EcoWhaleBalance - (0, viem_1.parseEther)('0.1'));
    }, 20000);
    (0, vitest_1.it)('sdk should be able to withdraw into the l2 bridge contract correctly', async () => {
        await viemClients_1.l2TestClient.impersonateAccount({ address: ECO_WHALE });
        const l2EcoWhaleSigner = await ethersProviders_1.l2Provider.getSigner(ECO_WHALE);
        const preBridgeL2EcoWhaleBalance = await getL2ERC20TokenBalance(ECO_WHALE);
        const crossChainMessenger = new src_1.CrossChainMessenger({
            l1SignerOrProvider: ethersProviders_1.l1Provider,
            l2SignerOrProvider: l2EcoWhaleSigner,
            l1ChainId: 5,
            l2ChainId: 420,
            bedrock: true,
            bridges: src_1.BRIDGE_ADAPTER_DATA[src_1.L2ChainID.OPTIMISM_GOERLI],
        });
        const txResponse = await crossChainMessenger.withdrawERC20(ECO_L1_TOKEN_ADDRESS, ECO_L2_TOKEN_ADDRESS, ethers_1.default.utils.parseEther('0.1'));
        await txResponse.wait();
        const l2EcoWhaleBalance = await getL2ERC20TokenBalance(ECO_WHALE);
        (0, vitest_1.expect)(l2EcoWhaleBalance).toEqual(preBridgeL2EcoWhaleBalance - (0, viem_1.parseEther)('0.1'));
    }, 20000);
});
