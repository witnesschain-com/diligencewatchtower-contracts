"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBridgeAdapters = exports.getAllOEContracts = exports.getOEContract = void 0;
const contracts_1 = require("@eth-optimism/contracts");
const ethers_1 = require("ethers");
const L1StandardBridge_json_1 = __importDefault(require("@eth-optimism/contracts-bedrock/forge-artifacts/L1StandardBridge.sol/L1StandardBridge.json"));
const L2StandardBridge_json_1 = __importDefault(require("@eth-optimism/contracts-bedrock/forge-artifacts/L2StandardBridge.sol/L2StandardBridge.json"));
const OptimismMintableERC20_json_1 = __importDefault(require("@eth-optimism/contracts-bedrock/forge-artifacts/OptimismMintableERC20.sol/OptimismMintableERC20.json"));
const OptimismPortal_json_1 = __importDefault(require("@eth-optimism/contracts-bedrock/forge-artifacts/OptimismPortal.sol/OptimismPortal.json"));
const L1CrossDomainMessenger_json_1 = __importDefault(require("@eth-optimism/contracts-bedrock/forge-artifacts/L1CrossDomainMessenger.sol/L1CrossDomainMessenger.json"));
const L2CrossDomainMessenger_json_1 = __importDefault(require("@eth-optimism/contracts-bedrock/forge-artifacts/L2CrossDomainMessenger.sol/L2CrossDomainMessenger.json"));
const OptimismMintableERC20Factory_json_1 = __importDefault(require("@eth-optimism/contracts-bedrock/forge-artifacts/OptimismMintableERC20Factory.sol/OptimismMintableERC20Factory.json"));
const ProxyAdmin_json_1 = __importDefault(require("@eth-optimism/contracts-bedrock/forge-artifacts/ProxyAdmin.sol/ProxyAdmin.json"));
const L2OutputOracle_json_1 = __importDefault(require("@eth-optimism/contracts-bedrock/forge-artifacts/L2OutputOracle.sol/L2OutputOracle.json"));
const L1ERC721Bridge_json_1 = __importDefault(require("@eth-optimism/contracts-bedrock/forge-artifacts/L1ERC721Bridge.sol/L1ERC721Bridge.json"));
const L2ERC721Bridge_json_1 = __importDefault(require("@eth-optimism/contracts-bedrock/forge-artifacts/L2ERC721Bridge.sol/L2ERC721Bridge.json"));
const L1Block_json_1 = __importDefault(require("@eth-optimism/contracts-bedrock/forge-artifacts/L1Block.sol/L1Block.json"));
const L2ToL1MessagePasser_json_1 = __importDefault(require("@eth-optimism/contracts-bedrock/forge-artifacts/L2ToL1MessagePasser.sol/L2ToL1MessagePasser.json"));
const GasPriceOracle_json_1 = __importDefault(require("@eth-optimism/contracts-bedrock/forge-artifacts/GasPriceOracle.sol/GasPriceOracle.json"));
const coercion_1 = require("./coercion");
const adapters_1 = require("../adapters");
const chain_constants_1 = require("./chain-constants");
/**
 * We've changed some contract names in this SDK to be a bit nicer. Here we remap these nicer names
 * back to the original contract names so we can look them up.
 */
const NAME_REMAPPING = {
    AddressManager: 'Lib_AddressManager',
    OVM_L1BlockNumber: 'iOVM_L1BlockNumber',
    WETH: 'WETH9',
    BedrockMessagePasser: 'L2ToL1MessagePasser',
};
const getContractInterfaceBedrock = (name) => {
    let artifact = '';
    switch (name) {
        case 'Lib_AddressManager':
        case 'AddressManager':
            artifact = '';
            break;
        case 'L1CrossDomainMessenger':
            artifact = L1CrossDomainMessenger_json_1.default;
            break;
        case 'L1ERC721Bridge':
            artifact = L1ERC721Bridge_json_1.default;
            break;
        case 'L2OutputOracle':
            artifact = L2OutputOracle_json_1.default;
            break;
        case 'OptimismMintableERC20Factory':
            artifact = OptimismMintableERC20Factory_json_1.default;
            break;
        case 'ProxyAdmin':
            artifact = ProxyAdmin_json_1.default;
            break;
        case 'L1StandardBridge':
            artifact = L1StandardBridge_json_1.default;
            break;
        case 'L2StandardBridge':
            artifact = L2StandardBridge_json_1.default;
            break;
        case 'OptimismPortal':
            artifact = OptimismPortal_json_1.default;
            break;
        case 'L2CrossDomainMessenger':
            artifact = L2CrossDomainMessenger_json_1.default;
            break;
        case 'OptimismMintableERC20':
            artifact = OptimismMintableERC20_json_1.default;
            break;
        case 'L2ERC721Bridge':
            artifact = L2ERC721Bridge_json_1.default;
            break;
        case 'L1Block':
            artifact = L1Block_json_1.default;
            break;
        case 'L2ToL1MessagePasser':
            artifact = L2ToL1MessagePasser_json_1.default;
            break;
        case 'GasPriceOracle':
            artifact = GasPriceOracle_json_1.default;
            break;
    }
    return new ethers_1.ethers.utils.Interface(artifact.abi);
};
/**
 * Returns an ethers.Contract object for the given name, connected to the appropriate address for
 * the given L2 chain ID. Users can also provide a custom address to connect the contract to
 * instead. If the chain ID is not known then the user MUST provide a custom address or this
 * function will throw an error.
 *
 * @param contractName Name of the contract to connect to.
 * @param l2ChainId Chain ID for the L2 network.
 * @param opts Additional options for connecting to the contract.
 * @param opts.address Custom address to connect to the contract.
 * @param opts.signerOrProvider Signer or provider to connect to the contract.
 * @returns An ethers.Contract object connected to the appropriate address and interface.
 */
const getOEContract = (contractName, l2ChainId, opts = {}) => {
    const addresses = chain_constants_1.CONTRACT_ADDRESSES[l2ChainId];
    if (addresses === undefined && opts.address === undefined) {
        throw new Error(`cannot get contract ${contractName} for unknown L2 chain ID ${l2ChainId}, you must provide an address`);
    }
    // Bedrock interfaces are backwards compatible. We can prefer Bedrock interfaces over legacy
    // interfaces if they exist.
    const name = NAME_REMAPPING[contractName] || contractName;
    let iface;
    try {
        iface = getContractInterfaceBedrock(name);
    }
    catch (err) {
        iface = (0, contracts_1.getContractInterface)(name);
    }
    return new ethers_1.Contract((0, coercion_1.toAddress)(opts.address || addresses.l1[contractName] || addresses.l2[contractName]), iface, opts.signerOrProvider);
};
exports.getOEContract = getOEContract;
/**
 * Automatically connects to all contract addresses, both L1 and L2, for the given L2 chain ID. The
 * user can provide custom contract address overrides for L1 or L2 contracts. If the given chain ID
 * is not known then the user MUST provide custom contract addresses for ALL L1 contracts or this
 * function will throw an error.
 *
 * @param l2ChainId Chain ID for the L2 network.
 * @param opts Additional options for connecting to the contracts.
 * @param opts.l1SignerOrProvider: Signer or provider to connect to the L1 contracts.
 * @param opts.l2SignerOrProvider: Signer or provider to connect to the L2 contracts.
 * @param opts.overrides Custom contract address overrides for L1 or L2 contracts.
 * @returns An object containing ethers.Contract objects connected to the appropriate addresses on
 * both L1 and L2.
 */
const getAllOEContracts = (l2ChainId, opts = {}) => {
    const addresses = chain_constants_1.CONTRACT_ADDRESSES[l2ChainId] || {
        l1: {
            AddressManager: undefined,
            L1CrossDomainMessenger: undefined,
            L1StandardBridge: undefined,
            StateCommitmentChain: undefined,
            CanonicalTransactionChain: undefined,
            BondManager: undefined,
            OptimismPortal: undefined,
            L2OutputOracle: undefined,
        },
        l2: chain_constants_1.DEFAULT_L2_CONTRACT_ADDRESSES,
    };
    // Attach all L1 contracts.
    const l1Contracts = {};
    for (const [contractName, contractAddress] of Object.entries(addresses.l1)) {
        l1Contracts[contractName] = (0, exports.getOEContract)(contractName, l2ChainId, {
            address: opts.overrides?.l1?.[contractName] || contractAddress,
            signerOrProvider: opts.l1SignerOrProvider,
        });
    }
    // Attach all L2 contracts.
    const l2Contracts = {};
    for (const [contractName, contractAddress] of Object.entries(addresses.l2)) {
        l2Contracts[contractName] = (0, exports.getOEContract)(contractName, l2ChainId, {
            address: opts.overrides?.l2?.[contractName] || contractAddress,
            signerOrProvider: opts.l2SignerOrProvider,
        });
    }
    return {
        l1: l1Contracts,
        l2: l2Contracts,
    };
};
exports.getAllOEContracts = getAllOEContracts;
/**
 * Gets a series of bridge adapters for the given L2 chain ID.
 *
 * @param l2ChainId Chain ID for the L2 network.
 * @param messenger Cross chain messenger to connect to the bridge adapters
 * @param opts Additional options for connecting to the custom bridges.
 * @param opts.overrides Custom bridge adapters.
 * @returns An object containing all bridge adapters
 */
const getBridgeAdapters = (l2ChainId, messenger, opts) => {
    const adapterData = {
        ...(chain_constants_1.CONTRACT_ADDRESSES[l2ChainId] || opts?.contracts?.l1?.L1StandardBridge
            ? {
                Standard: {
                    Adapter: adapters_1.StandardBridgeAdapter,
                    l1Bridge: opts?.contracts?.l1?.L1StandardBridge ||
                        chain_constants_1.CONTRACT_ADDRESSES[l2ChainId].l1.L1StandardBridge,
                    l2Bridge: contracts_1.predeploys.L2StandardBridge,
                },
                ETH: {
                    Adapter: adapters_1.ETHBridgeAdapter,
                    l1Bridge: opts?.contracts?.l1?.L1StandardBridge ||
                        chain_constants_1.CONTRACT_ADDRESSES[l2ChainId].l1.L1StandardBridge,
                    l2Bridge: contracts_1.predeploys.L2StandardBridge,
                },
            }
            : {}),
        ...(chain_constants_1.BRIDGE_ADAPTER_DATA[l2ChainId] || {}),
        ...(opts?.overrides || {}),
    };
    const adapters = {};
    for (const [bridgeName, bridgeData] of Object.entries(adapterData)) {
        adapters[bridgeName] = new bridgeData.Adapter({
            messenger,
            l1Bridge: bridgeData.l1Bridge,
            l2Bridge: bridgeData.l2Bridge,
        });
    }
    return adapters;
};
exports.getBridgeAdapters = getBridgeAdapters;
