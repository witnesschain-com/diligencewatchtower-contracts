require("@nomicfoundation/hardhat-toolbox");
require ('@openzeppelin/hardhat-upgrades');
require ('hardhat-preprocessor');
const fs = require("fs");

function getRemappings() {
  return fs
    .readFileSync("remappings.txt", "utf8")
    .split("\n")
    .filter(Boolean) // remove empty lines
    .map((line) => line.trim().split("="));
}

/** @type import('hardhat/config').HardhatUserConfig */

module.exports = {
  solidity: "0.8.15",
  preprocess: {
    eachLine: (hre) => ({
      transform: (line) => {
        if (line.match(/^\s*import /i)) {
          for (const [from, to] of getRemappings()) {
            if (line.includes(from)) {
              line = line.replace(from, to);
              break;
            }
          }
        }
        return line;
      },
    }),
  },
  settings: {
    evmVersion: "london",
    "optimizer": {
      "runs": 200,
      "enabled": true,
    }
  },
  paths: { sources:"./src",
  tests:"./test",
},
  networks: {
    "witnesschain-op": {
      url: "http://65.2.30.76:8545",
      chainId: 42069,
      accounts: [`${process.env.PRIVATE_KEY}`],
      
    },
    "witnesschain-testnet": {
      url: "https://witnesschain-testnet-rpc.eu-north-2.gateway.fm",
      chainId: 250628747,
      accounts: [`${process.env.PRIVATE_KEY}`],
      
    },
    "blue-orangutan": {
      url: "https://blue-orangutan-rpc.eu-north-2.gateway.fm",
      chainId: 1237146866,
      accounts: [`${process.env.PRIVATE_KEY}`],
    },
    "l2-mainnet": {
      url: "https://rpc.witnesschain.com",
      chainId: 1702448187,
      accounts: [`${process.env.PRIVATE_KEY}`],
    }
  },
  etherscan: {
    apiKey: {
      "witnesschain-testnet": process.env.ETHERSCAN_API_KEY,
      "witnesschain-op": process.env.ETHERSCAN_API_KEY,
      "blue-orangutan": process.env.ETHERSCAN_API_KEY,
      "l2-mainnet": process.env.ETHERSCAN_API_KEY
    },
    customChains: [
      {
        network: "witnesschain-testnet",
        chainId: 250628747,
        urls: {
          apiURL: "https://witnesschain-testnet-blockscout.eu-north-2.gateway.fm/api/",
          browserURL: "https://witnesschain-testnet-blockscout.eu-north-2.gateway.fm",
        },
      },
      {
        network: "blue-orangutan",
        chainId: 1237146866,
        urls: {
          apiURL: "https://blue-orangutan-blockscout.eu-north-2.gateway.fm/api/",
          browserURL: "https://blue-orangutan-blockscout.eu-north-2.gateway.fm",
        },
      },
      {
        network: "l2-mainnet",
        chainId: 1702448187,
        urls: {
          apiURL: "https://explorer.witnesschain.com/api/",
          browserURL: "https://explorer.witnesschain.com",
        },
      }
    ],
  }
};
