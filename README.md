# Witness Chain Diligence Watchtowers
Diligence watchtowers are the first line of defense for optimistic rollups. They enable incentive compatible and crypto-economically-secure Proof-of-Diligence (PoD) to make sure watchtowers are working in the happy path for optimistic rollups. 

# Why Watchtowers?

Optimistic rollups attain their hyper scaling by validating the transactions on another chain and post the transaction data publicly for anyone to view. If faulty transactions are detected, the Ethereum validators can be engaged for arbitration using a fraud proof. Thus, the current premise operates under the assumption that when a fault is detected, validators initiate fraud proofs, engaging in a dispute resolution process. However, the existing incentive system only comes into play after a fault has been identified. 

But who will look for these faulty transaction consistently ? How will these players be incentivized to be diligently carrying out this task when nothing is going wrong? 

Witness Chain Watchtower protocol is answer to these problems. 

It is a programmable, trust-free, and decentralized watchtower service that uses an innovative proof of diligence to incentivize the watchtowers in normal path.

# Basics

If you would like to understand more about the watchtower protocol and it's basics, please follow this [guide](https://docs.witnesschain.com/diligence-watchtowers/watchtower-protocol-version-2)

If you are a node operator and want to quickly get started, you can refer to the 
- [Node operator guide](https://docs.witnesschain.com/diligence-watchtowers/for-the-node-operators/watchtower-setup/mainnet-setup)

```
The code base is primarily shared to assist you in thoroughly exploring the smart contracts, enabling you to comprehend their interactions with both the watchtower client and EigenLayer contracts.
```

# Deployments
## Mainnet Deployment
The present deployment on the mainnet marks our initial release. Below, you can find the addresses of the deployed contracts.

### Smart Contracts
| Name | Solidity | Proxy | Implementation | 
| -------- | -------- | -------- | -------- | 
| OperatorRegistry | [`OperatorRegistry`](https://github.com/kaleidoscope-blockchain/eigenlayer-avs-watchtower/blob/development/src/smart_contracts/src/core/OperatorRegistry.sol) | [`0xEf1...85D`](https://etherscan.io/address/0xEf1a89841fd189ba28e780A977ca70eb1A5e985D) | [`0xa90...B76`](https://etherscan.io/address/0xa90a9E4EE979b5705a8DB8FC113Dd5DDedC5EB76) | 
| L2ChainMapping | [`L2ChainMapping`](https://github.com/kaleidoscope-blockchain/eigenlayer-avs-watchtower/blob/development/src/smart_contracts/src/core/L2ChainMapping.sol) | | [`0x20b...2A4`](https://etherscan.io/address/0x20b8aE105526182fF18d4b4934D340dd061c52A4) | 
| WitnessHub | [`WitnessHub`](https://github.com/kaleidoscope-blockchain/eigenlayer-avs-watchtower/blob/development/src/smart_contracts/src/core/WitnessHub.sol) | [`0xD25...cC7`](https://etherscan.io/address/0xD25c2c5802198CB8541987b73A8db4c9BCaE5cC7) | [`0xe1F...7bD`](https://etherscan.io/address/0xe1F108D5d2337987F818E8b2E61D2E0E36cbF7bD) | 
| AlertManager | [`AlertManager`](https://github.com/kaleidoscope-blockchain/eigenlayer-avs-watchtower/blob/development/src/smart_contracts/src/core/AlertManager.sol) | [`0xD1b...2eE`](https://etherscan.io/address/0xD1b991530D07f03226b0192E0161E1142d3552eE) | [`0xFF1...376`](https://etherscan.io/address/0xFF1F6c0d2afcb4A22e52FeA08D5A7cc0a1c49376) | 

### MultiSig

| Name | Address | Implementation | 
| -------- | -------- |  -------- | 
| Admin Multisig | [`0xec6...0f3`](https://etherscan.io/address/0xec6D5f54dC69EBed2379470303B706491E9E80f3) | [`0xd9b...552`](https://etherscan.io/address/0xd9db270c1b5e3bd161e8c8503c55ceabee709552)| 

## HoleSky Deployment
The current deployment on the testnet is on Holesky. Below, you can see the addresses of the deployed contracts

### Smart Contracts
| Name | Solidity | Proxy | Implementation | 
| -------- | -------- | -------- | -------- | 
| OperatorRegistry | [`OperatorRegistry`](https://github.com/kaleidoscope-blockchain/eigenlayer-avs-watchtower/blob/development/src/smart_contracts/src/core/OperatorRegistry.sol) | [`0xEf1...85D`](https://holesky.etherscan.io/address/0xEf1a89841fd189ba28e780A977ca70eb1A5e985D) | [`0xa90...B76`](https://holesky.etherscan.io/address/0xa90a9E4EE979b5705a8DB8FC113Dd5DDedC5EB76) | 
| L2ChainMapping | [`L2ChainMapping`](https://github.com/kaleidoscope-blockchain/eigenlayer-avs-watchtower/blob/development/src/smart_contracts/src/core/L2ChainMapping.sol) | | [`0x20b...2A4`](https://holesky.etherscan.io/address/0x20b8aE105526182fF18d4b4934D340dd061c52A4) | 
| WitnessHub | [`WitnessHub`](https://github.com/kaleidoscope-blockchain/eigenlayer-avs-watchtower/blob/development/src/smart_contracts/src/core/WitnessHub.sol) | [`0xD25...cC7`](https://holesky.etherscan.io/address/0xD25c2c5802198CB8541987b73A8db4c9BCaE5cC7) | [`0xe1F...7bD`](https://holesky.etherscan.io/address/0xe1F108D5d2337987F818E8b2E61D2E0E36cbF7bD) | 
| AlertManager | [`AlertManager`](https://github.com/kaleidoscope-blockchain/eigenlayer-avs-watchtower/blob/development/src/smart_contracts/src/core/AlertManager.sol) | [`0xc69...88a`](https://holesky.etherscan.io/address/0xc697aF7aF3C8c5Ce614d8BC0F252377233D9588a) | [`0x7f8...98B`](https://holesky.etherscan.io/address/0x7f8D15ee84e4E8F04e29fe00c64820FBB086298B) | 