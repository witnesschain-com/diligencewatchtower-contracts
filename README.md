## Smart Contract Setup (ONLY FOR DEVELOPERS)
Security for optimistic rollups (ORs) is derived from dispute resolution at L1 for suspicious transactions. The first line of defense is offered by parties who first identify suspicious transactions. Currently deployed ORs rely on relatively centralized (and trusted) entities who offer this line of defense; e.g., Arbitrum’s state assertion can only be disputed by a set of 12 whitelisted defensive validator nodes.

The surge in demand for app-specific rollups and platforms to support them (e.g., Base and Eigenlayer) results from increasing value and diversity of transactions relying on L2s. In turn, there is a need for decentralized and trust-free validators who diligently raise the alarm when they detect a suspicious transaction. Witness Chain Watchtowers provide the first line of defense for rollups, which is:
- Trust-free: provides Proof of Diligence of watchtowers with Ethereum trust (through EigenLayer)
- Decentralized: provides a Proof of Location for verifying the geo-location of watchtowers and enforcing desired physical decentralization.
- Programmable: provides SLA smart contracts to scale the number/stake of watchtowers and their decentralization properties with the value of vulnerable transactions.

### Getting Started

#### Prerequisites
Setting up Witness Chain smart contracts involves several prerequisites. Here's a 
list to help you get started:

- Install [`Foundry`](https://book.getfoundry.sh/)
- Install [`Anvil`](https://book.getfoundry.sh/anvil/)

#### Steps

1. git clone this repository
```
git clone https://github.com/kaleidoscope-blockchain/eigenlayer-avs-watchtower.git
```

2. Fork goerli on a local anvil chain with EL contracts.
```
anvil --fork-url https://goerli.gateway.tenderly.co
```

3. In a separate terminal, run

```
export RPC_URL=http://localhost:8545
export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
export AGGREGATOR=0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 // Aggregator is the ETH Address of the Private Key
export CHAIN_ID=5
make test
```
All the above tests should pass

### Current Mainnet Deployment

| Name | Solidity | Proxy | Implementation | 
| -------- | -------- | -------- | -------- | 
| OperatorRegistry | [`OperatorRegistry`](https://github.com/kaleidoscope-blockchain/eigenlayer-avs-watchtower/blob/development/src/smart_contracts/src/core/OperatorRegistry.sol) | [`0xEf1...85D`](https://etherscan.io/address/0xEf1a89841fd189ba28e780A977ca70eb1A5e985D) | [`0xa90...B76`](https://etherscan.io/address/0xa90a9E4EE979b5705a8DB8FC113Dd5DDedC5EB76) | 
| L2ChainMapping | [`L2ChainMapping`](https://github.com/kaleidoscope-blockchain/eigenlayer-avs-watchtower/blob/development/src/smart_contracts/src/core/L2ChainMapping.sol) | | [`0x20b...2A4`](https://etherscan.io/address/0x20b8aE105526182fF18d4b4934D340dd061c52A4) | 
| WitnessHub | [`WitnessHub`](https://github.com/kaleidoscope-blockchain/eigenlayer-avs-watchtower/blob/development/src/smart_contracts/src/core/WitnessHub.sol) | [`0xD25...cC7`](https://etherscan.io/address/0xD25c2c5802198CB8541987b73A8db4c9BCaE5cC7) | [`0xe1F...7bD`](https://etherscan.io/address/0xe1F108D5d2337987F818E8b2E61D2E0E36cbF7bD) | 
| AlertManager | [`AlertManager`](https://github.com/kaleidoscope-blockchain/eigenlayer-avs-watchtower/blob/development/src/smart_contracts/src/core/AlertManager.sol) | [`0xD1b...2eE`](https://etherscan.io/address/0xD1b991530D07f03226b0192E0161E1142d3552eE) | [`0xFF1...376`](https://etherscan.io/address/0xFF1F6c0d2afcb4A22e52FeA08D5A7cc0a1c49376) | 

### Current HoleSky Deployment
| Name | Solidity | Proxy | Implementation | 
| -------- | -------- | -------- | -------- | 
| OperatorRegistry | [`OperatorRegistry`](https://github.com/kaleidoscope-blockchain/eigenlayer-avs-watchtower/blob/development/src/smart_contracts/src/core/OperatorRegistry.sol) | [`0xEf1...85D`](https://holesky.etherscan.io/address/0xEf1a89841fd189ba28e780A977ca70eb1A5e985D) | [`0xa90...B76`](https://holesky.etherscan.io/address/0xa90a9E4EE979b5705a8DB8FC113Dd5DDedC5EB76) | 
| L2ChainMapping | [`L2ChainMapping`](https://github.com/kaleidoscope-blockchain/eigenlayer-avs-watchtower/blob/development/src/smart_contracts/src/core/L2ChainMapping.sol) | | [`0x20b...2A4`](https://holesky.etherscan.io/address/0x20b8aE105526182fF18d4b4934D340dd061c52A4) | 
| WitnessHub | [`WitnessHub`](https://github.com/kaleidoscope-blockchain/eigenlayer-avs-watchtower/blob/development/src/smart_contracts/src/core/WitnessHub.sol) | [`0xD25...cC7`](https://holesky.etherscan.io/address/0xD25c2c5802198CB8541987b73A8db4c9BCaE5cC7) | [`0xe1F...7bD`](https://holesky.etherscan.io/address/0xe1F108D5d2337987F818E8b2E61D2E0E36cbF7bD) | 
| AlertManager | [`AlertManager`](https://github.com/kaleidoscope-blockchain/eigenlayer-avs-watchtower/blob/development/src/smart_contracts/src/core/AlertManager.sol) | [`0xc69...88a`](https://holesky.etherscan.io/address/0xc697aF7aF3C8c5Ce614d8BC0F252377233D9588a) | [`0x7f8...98B`](https://holesky.etherscan.io/address/0x7f8D15ee84e4E8F04e29fe00c64820FBB086298B) | 