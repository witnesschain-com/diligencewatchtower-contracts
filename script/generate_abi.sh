#!/bin/bash
SRC=src/smart_contracts/src/core
LIB=src/smart_contracts/

REMAPPINGS="@eigenlayer-contracts/=lib/eigenlayer-contracts/
@openzeppelin-upgrades/=lib/openzeppelin-contracts-upgradeable/
@openzeppelin/=lib/openzeppelin-contracts/
ds-test/=lib/eigenlayer-contracts/lib/ds-test/src/
forge-std/=lib/forge-std/src/
@optimism/=lib/optimism/"

solc $REMAPPINGS --abi $SRC/OperatorRegistry.sol -o build --base-path / --include-path "$LIB" --overwrite
solc $REMAPPINGS --abi $SRC/DiligenceProofManager.sol -o build --base-path / --include-path "$LIB" --overwrite
solc $REMAPPINGS --abi $SRC/AlertManager.sol -o build --base-path / --include-path "$LIB" --overwrite
solc $REMAPPINGS --abi $SRC/WitnessHub.sol -o build --base-path / --include-path "$LIB" --overwrite

abigen --abi build/OperatorRegistry.abi --pkg bindings --type OperatorRegistry --out build/OperatorRegistry.go
abigen --abi build/DiligenceProofManager.abi --pkg bindings --type DiligenceProofManager --out build/DiligenceProofManager.go
abigen --abi build/AlertManager.abi --pkg bindings --type AlertManager --out build/AlertManager.go
abigen --abi build/WitnessHub.abi --pkg bindings --type WitnessHub --out build/WitnessHub.go