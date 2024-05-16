// npx hardhat run script/deployment/testnet/l2/upgrade-proxy-OperatorRegistry.js --network witnesschain-testnet       
const { ethers, upgrades } = require("hardhat");

var OPERATOR_REGISTRY_PROXY= "0x11dbfa16074d1D3485e66800c321cf31ABacbEb3";
const OPERATOR_REGISTRY_ABI = [ 
  { 
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": false,
              "internalType": "address",
              "name": "previousAdmin",
              "type": "address"
          },
          {
              "indexed": false,
              "internalType": "address",
              "name": "newAdmin",
              "type": "address"
          }
      ],
      "name": "AdminChanged",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": true,
              "internalType": "address",
              "name": "beacon",
              "type": "address"
          }
      ],
      "name": "BeaconUpgraded",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": false,
              "internalType": "uint8",
              "name": "version",
              "type": "uint8"
          }
      ],
      "name": "Initialized",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": false,
              "internalType": "address",
              "name": "operator",
              "type": "address"
          },
          {
              "indexed": false,
              "internalType": "uint256",
              "name": "blockNumber",
              "type": "uint256"
          }
      ],
      "name": "OperatorSuspended",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": false,
              "internalType": "address[]",
              "name": "operator",
              "type": "address[]"
          },
          {
              "indexed": false,
              "internalType": "uint256",
              "name": "blockNumber",
              "type": "uint256"
          }
      ],
      "name": "OperatorsWhiteListed",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": true,
              "internalType": "address",
              "name": "previousOwner",
              "type": "address"
          },
          {
              "indexed": true,
              "internalType": "address",
              "name": "newOwner",
              "type": "address"
          }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": false,
              "internalType": "address",
              "name": "account",
              "type": "address"
          }
      ],
      "name": "Paused",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": false,
              "internalType": "address",
              "name": "account",
              "type": "address"
          }
      ],
      "name": "Unpaused",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": true,
              "internalType": "address",
              "name": "implementation",
              "type": "address"
          }
      ],
      "name": "Upgraded",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": false,
              "internalType": "address",
              "name": "operator",
              "type": "address"
          },
          {
              "indexed": false,
              "internalType": "address",
              "name": "watchtower",
              "type": "address"
          },
          {
              "indexed": false,
              "internalType": "uint256",
              "name": "blockNumber",
              "type": "uint256"
          }
      ],
      "name": "WatchtowerDeRegisteredFromOperator",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": false,
              "internalType": "address",
              "name": "operator",
              "type": "address"
          },
          {
              "indexed": false,
              "internalType": "address",
              "name": "watchtower",
              "type": "address"
          },
          {
              "indexed": false,
              "internalType": "uint256",
              "name": "blockNumber",
              "type": "uint256"
          }
      ],
      "name": "WatchtowerRegisteredToOperator",
      "type": "event"
  },
  {
      "inputs": [
          {
              "internalType": "address[]",
              "name": "operatorsList",
              "type": "address[]"
          }
      ],
      "name": "addToOperatorWhitelist",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "operator",
              "type": "address"
          },
          {
              "internalType": "uint256",
              "name": "expiry",
              "type": "uint256"
          }
      ],
      "name": "calculateWatchtowerRegistrationMessageHash",
      "outputs": [
          {
              "internalType": "bytes32",
              "name": "",
              "type": "bytes32"
          }
      ],
      "stateMutability": "pure",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "checkIsDelegatedOperator",
      "outputs": [
          {
              "internalType": "bool",
              "name": "",
              "type": "bool"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "watchtowerAddress",
              "type": "address"
          }
      ],
      "name": "deRegister",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "delegationManagerAddress",
      "outputs": [
          {
              "internalType": "address",
              "name": "",
              "type": "address"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "disableCheckIsDelegatedOperator",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "enableCheckIsDelegatedOperator",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "getAllActiveOperators",
      "outputs": [
          {
              "internalType": "address[]",
              "name": "",
              "type": "address[]"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "watchtower",
              "type": "address"
          }
      ],
      "name": "getOperator",
      "outputs": [
          {
              "internalType": "address",
              "name": "operator",
              "type": "address"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "_delegationManagerAddress",
              "type": "address"
          },
          {
              "internalType": "address",
              "name": "_slasherAddress",
              "type": "address"
          }
      ],
      "name": "initialize",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "operator",
              "type": "address"
          }
      ],
      "name": "isActiveOperator",
      "outputs": [
          {
              "internalType": "bool",
              "name": "",
              "type": "bool"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "watchtower",
              "type": "address"
          }
      ],
      "name": "isValidWatchtower",
      "outputs": [
          {
              "internalType": "bool",
              "name": "",
              "type": "bool"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "operator",
              "type": "address"
          }
      ],
      "name": "isWhitelisted",
      "outputs": [
          {
              "internalType": "bool",
              "name": "",
              "type": "bool"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "",
              "type": "address"
          }
      ],
      "name": "operatorDetails",
      "outputs": [
          {
              "internalType": "address",
              "name": "operatorAddress",
              "type": "address"
          },
          {
              "internalType": "bool",
              "name": "isActive",
              "type": "bool"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "owner",
      "outputs": [
          {
              "internalType": "address",
              "name": "",
              "type": "address"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "paused",
      "outputs": [
          {
              "internalType": "bool",
              "name": "",
              "type": "bool"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "proxiableUUID",
      "outputs": [
          {
              "internalType": "bytes32",
              "name": "",
              "type": "bytes32"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "watchtower",
              "type": "address"
          },
          {
              "internalType": "uint256",
              "name": "expiry",
              "type": "uint256"
          },
          {
              "internalType": "bytes",
              "name": "signedMessage",
              "type": "bytes"
          }
      ],
      "name": "registerWatchtowerAsOperator",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "_delegationManagerAddress",
              "type": "address"
          }
      ],
      "name": "setDelegationManagerAddress",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "_slasherAddress",
              "type": "address"
          }
      ],
      "name": "setSlasherAddress",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [],
      "name": "slasherAddress",
      "outputs": [
          {
              "internalType": "address",
              "name": "",
              "type": "address"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "operatorAddress",
              "type": "address"
          }
      ],
      "name": "suspend",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "newOwner",
              "type": "address"
          }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "newImplementation",
              "type": "address"
          }
      ],
      "name": "upgradeTo",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "newImplementation",
              "type": "address"
          },
          {
              "internalType": "bytes",
              "name": "data",
              "type": "bytes"
          }
      ],
      "name": "upgradeToAndCall",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
  }
]

async function main() {
  const operatorRegistryCodeFactory = await ethers.getContractFactory("OperatorRegistry");
  const provider = new ethers.JsonRpcProvider("https://witnesschain-testnet-rpc.eu-north-2.gateway.fm");
  var signer = new ethers.Wallet("0xdf4caa61d929f89e824e3cebb7ef62891acecbb0e12b4c22beee7c91a34a7e9c");
  const operatorRegistryProxy = await upgrades.upgradeProxy(OPERATOR_REGISTRY_PROXY,operatorRegistryCodeFactory,{kind:"uups"});
  await operatorRegistryProxy.waitForDeployment();
  console.log("OperatorRegistry Proxy deployed to:", await operatorRegistryProxy.address);
}

main();