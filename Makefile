DEPLOYMENT := 

ifndef CHAIN_ID
$(error CHAIN_ID is not defined. Export it via `export CHAIN_ID=<chain number>`. eg: `export CHAIN_ID=5`)
endif

ifndef CHAIN_ENV
$(error CHAIN_ENV is not defined. Export it via `export CHAIN_ENV=<devnet/mainnet/testnet>`. eg: `export CHAIN_ENV=devnet`)
endif

ifndef L2_CHAIN_ID
$(error L2_CHAIN_ID is not defined. Export it via `export L2_CHAIN_ID=<chain number>`. eg: `export L2_CHAIN_ID=250628747`)
endif

ifndef RPC_URL
$(error RPC_URL is not defined. Export it via `export RPC_URL=<url>`. eg: `export RPC_URL=http://localhost:8545`)
endif

ifndef RPC_URL_L2
$(error RPC_URL_L2 is not defined. Export it via `export RPC_URL_L2=<url>`. eg: `export RPC_URL_L2=http://localhost:8545`)
endif

ifndef PRIVATE_KEY
$(error PRIVATE_KEY is not defined. Export it via `export PRIVATE_KEY=<PRIVATE_KEY>`. eg: `export PRIVATE_KEY=`)
endif

ifndef AGGREGATOR
$(error AGGREGATOR is not defined. Export it via `export AGGREGATOR=<AGGREGATOR ADDRESS>`. eg: `export AGGREGATOR=`)
endif

ifeq (localhost,$(findstring localhost,$(RPC_URL)))
# RPC_URL contains "localhost", skipping ETHERSCAN_API_KEY check
	DEPLOYMENT := local
else
	ifndef ETHERSCAN_API_KEY
	$(error ETHERSCAN_API_KEY is not defined. Export it via `export ETHERSCAN_API_KEY=<ETHERSCAN_API_KEY>`. eg: `export ETHERSCAN_API_KEY=6IXGG8RAB263456GJ6E9FPH9X1YQYX6F12`)
	endif
	DEPLOYMENT := remote
endif

deploy-watchtower-avs-smart_contracts:
	@if [ "$(DEPLOYMENT)" = "local" ]; then \
		forge script ./script/deployment/$(CHAIN_ENV)/DeployWatchtower.s.sol:DeployWatchtower --rpc-url $(RPC_URL) --private-key $(PRIVATE_KEY) --broadcast --chain-id $(CHAIN_ID); \
	else \
		forge script ./script/deployment/$(CHAIN_ENV)/DeployWatchtower.s.sol:DeployWatchtower --rpc-url $(RPC_URL) --private-key $(PRIVATE_KEY) --broadcast --verify --verifier-url https://api.etherscan.io/api\? --etherscan-api-key $ETHERSCAN_API_KEY ; \
	fi

register-operators-with-eigenlayer:
	echo $(RPC_URL)
	@forge script ./script/deployment/$(CHAIN_ENV)/RegisterOperatorsWithEL.s.sol:RegisterOperatorsWithEL --rpc-url $(RPC_URL) --private-key $(PRIVATE_KEY) --broadcast --chain-id $(CHAIN_ID)

test: deploy-watchtower-avs-smart_contracts register-operators-with-eigenlayer
	@forge test --rpc-url $(RPC_URL)

.PHONY: test
