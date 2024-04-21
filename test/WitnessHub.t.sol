// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.15;

import {Test, console2} from "forge-std/Test.sol";
import {WitnessHub, IWitnessHub} from "../src/core/WitnessHub.sol";
import {OperatorRegistry} from "../src/core/OperatorRegistry.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {L2ChainMapping} from "../src/core/L2ChainMapping.sol";
import {IL2ChainMapping} from "../src/interfaces/IL2ChainMapping.sol";
import {Types} from "../src/libraries/Types.sol";
import "forge-std/Script.sol";
import "forge-std/console.sol";

import {ISignatureUtils} from "eigenlayer-contracts/src/contracts/interfaces/ISignatureUtils.sol";
import {IAVSDirectory} from "eigenlayer-contracts/src/contracts/interfaces/IAVSDirectory.sol";
import {IStrategy} from "eigenlayer-contracts/src/contracts/interfaces/IStrategy.sol";
import {L2ChainMappingMock} from "./mocks/L2ChainMappingMock.sol";

/**
 * Setup the following variables before you run the tests
 * 
 * @dev
   export PRIVATE_KEY=<Private Key used during DeployWatchtower.sol>
   export CHAIN_ID=5 or the forked devnet chain
   export AGGREGATOR=<aggregator eth address>
   export RPC_URL=http://localhost:8545

 * forge test --rpc-url http://127.0.0.1:8545 -vvvv
 * forge test --match-contract WitnessHubTest --rpc-url http://127.0.0.1:8545 -vvvv
 */

contract WitnessHubTest is Test {
    using ECDSA for bytes32;

    OperatorRegistry public operatorRegistry;

    address[] operatorsList = new address[](2);
    uint256[] operatorsListPrivateKey = new uint256[](2);
    address[] watchtowersList = new address[](2);
    uint256[] watchTowersListPrivateKey = new uint256[](2);
    IWitnessHub.StrategyParam[] public params;

    address mainnetL2OOAddressOptimism;
    address mainnetL2OOAddressBase;
    address goerliL2OOAddressOptimism;
    address goerliL2OOAddressBase;
    address sepoliaL2OOAddressOptimism;
    address sepoliaL2OOAddressBase;

    L2ChainMapping public l2ChainMapping;

    address public AVS_Directory;
    IAVSDirectory public avsDirectory;

    uint256 _chainID = 420; // OP Goerli ChainID

    address public Witness_Hub;
    WitnessHub public witnessHub;

    uint256 REWARD_BLOCKS = 120;

    uint256 deployerPrivateKey;

    enum BountyState {
        Configured,
        Initialized,
        InProgress,
        Rewarded
    }

    BountyState public currentBountyStatus;

    struct Bounty {
        uint256 l2BlockNumber;
        uint256 amount;
        mapping(address => bytes32) minerStateRoots;
        address winner;
        BountyState status;
    }

    function readOutput(string memory outputFileName) internal view returns (string memory) {
        string memory chainEnv = vm.envString("CHAIN_ENV");
        string memory inputDir = string.concat(
            vm.projectRoot(),
            "/script/deployment/",
            chainEnv,
            "/output/"
        );        
        string memory chainDir = string.concat(vm.toString(block.chainid), "/");
        string memory file = string.concat(outputFileName, ".json");
        return vm.readFile(string.concat(inputDir, chainDir, file));
    }

    function readInput(string memory outputFileName) internal view returns (string memory) {
        string memory chainEnv = vm.envString("CHAIN_ENV");
        string memory inputDir = string.concat(
            vm.projectRoot(),
            "/script/deployment/",
            chainEnv,
            "/input/"
        );        
        string memory chainDir = string.concat(vm.toString(block.chainid), "/");
        string memory file = string.concat(outputFileName, ".json");
        return vm.readFile(string.concat(inputDir, chainDir, file));
    }

    function signMessage (uint256 signerPrivateKey, address _addr, uint256 expiry) pure internal returns (bytes memory, bytes32, bytes memory )  {
        bytes memory message = abi.encode(_addr,expiry);
        bytes32 messageHash = keccak256(message);
        bytes32 eth_signed_message = messageHash.toEthSignedMessageHash();
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerPrivateKey, eth_signed_message);
        bytes memory signature = abi.encodePacked(r, s, v);
        return (message, messageHash,signature);
    }
    function setUp() public {
        deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        //AVS_Directory = vm.envAddress("AVS_DIRECTORY");
        //avsDirectory = IAVSDirectory(AVS_Directory);

        string memory configData = readOutput("deployment_output");

        address OPERATOR_REGISTRY_PROXY = stdJson.readAddress(configData, ".addresses.OperatorRegistryProxy");
        address WITNESSHUB_PROXY = stdJson.readAddress(configData, ".addresses.WitnessHubProxy");
        address L2CHAINMAPPING = stdJson.readAddress(configData, ".addresses.l2ChainMapping");

        string memory externalData = readInput("addresses_input");

        // Addresses used in L2ChainMappingMock constructor
        mainnetL2OOAddressOptimism = address(stdJson.readAddress(externalData, ".addresses.MainnetL2OOOptimism"));
        mainnetL2OOAddressBase = address(stdJson.readAddress(externalData, ".addresses.MainnetL2OOBase"));
        goerliL2OOAddressOptimism = address(stdJson.readAddress(externalData, ".addresses.GoerliL2OOOptimism"));
        goerliL2OOAddressBase = address(stdJson.readAddress(externalData, ".addresses.GoerliL2OOBase"));
        sepoliaL2OOAddressOptimism = address(stdJson.readAddress(externalData, ".addresses.SepoliaL2OOOptimism"));
        sepoliaL2OOAddressBase = address(stdJson.readAddress(externalData, ".addresses.SepoliaL2OOBase"));
        avsDirectory = IAVSDirectory(address(stdJson.readAddress(externalData, ".addresses.AVSDirectory")));

        // Whitelist operators and register with Witness Chain Watchtower
        operatorRegistry = OperatorRegistry(OPERATOR_REGISTRY_PROXY);

        l2ChainMapping = L2ChainMapping(L2CHAINMAPPING);

        Witness_Hub = WITNESSHUB_PROXY;
        witnessHub = WitnessHub(WITNESSHUB_PROXY);

        // Test Operators in EL Goerli Anvil
        operatorsListPrivateKey[0] = 0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97;
        operatorsListPrivateKey[1] = 0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6;

        // Test dummy Watchtowers
        watchTowersListPrivateKey[0] = 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a;
        watchTowersListPrivateKey[1] = 0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba;


        // Get a list of operator and watchtower addresses
        for (uint256 i = 0; i < 2; i++) {
            operatorsList[i] = vm.addr(operatorsListPrivateKey[i]);
            watchtowersList[i] = vm.addr(watchTowersListPrivateKey[i]);
        }

        // Whitelisting of operators is only possible by Witness Chain Admin
        vm.startBroadcast(deployerPrivateKey);
        operatorRegistry.addToOperatorWhitelist(operatorsList);
        vm.stopBroadcast();

        // Simulate registering of individual watchtowers
        for (uint256 i = 0; i < 2; i++) {
            vm.startPrank(operatorsList[i]);
            uint256 expiry = block.number+100000000000;
            (,, bytes memory signedMessage) 
                = signMessage(watchTowersListPrivateKey[i],operatorsList[i],expiry);
            operatorRegistry.registerWatchtowerAsOperator(watchtowersList[i], expiry, signedMessage);
            vm.stopPrank();
        }
    }

    /**
     * INTERNAL / HELPER FUNCTIONS
     */

    /**
     * @notice internal function for calculating a signature from the operator corresponding to `_operatorPrivateKey`, delegating them to
     * the `operator`, and expiring at `expiry`.
     */


    function _getOperatorSignature(
        uint256 _operatorPrivateKey,
        address operator,
        address avs,
        bytes32 salt,
        uint256 expiry
    ) internal view returns (ISignatureUtils.SignatureWithSaltAndExpiry memory operatorSignature) {
        operatorSignature.expiry = expiry;
        operatorSignature.salt = salt;
        {
            bytes32 digestHash = avsDirectory.calculateOperatorAVSRegistrationDigestHash(operator, avs, salt, expiry);
            (uint8 v, bytes32 r, bytes32 s) = vm.sign(_operatorPrivateKey, digestHash);
            operatorSignature.signature = abi.encodePacked(r, s, v);
        }
        return operatorSignature;
    }

    // Pass: Verifies an operator registers successful to avs
    function testFuzz_registerOperatorToAVSAsAVS(bytes32 salt) public {
        address operator = operatorsList[0];

        uint256 expiry = type(uint256).max;

        vm.startPrank(Witness_Hub);
        ISignatureUtils.SignatureWithSaltAndExpiry memory operatorSignature =
            _getOperatorSignature(operatorsListPrivateKey[0], operatorsList[0], Witness_Hub, salt, expiry);

        avsDirectory.registerOperatorToAVS(operator, operatorSignature);
        vm.stopPrank();
    }

    // Fail: verifies setting strategy params as non-owner
    function testSetStrategyParamsAsNonOwner() public {
        address strat1Address = address(bytes20(bytes("0xb613e78e2068d7489bb66419fb1cfa11275d14da")));
        IWitnessHub.StrategyParam memory strat1 =
            IWitnessHub.StrategyParam({strategy: IStrategy(strat1Address), multiplier: 2});

        params.push(strat1);
        vm.startPrank(watchtowersList[1]);
        vm.expectRevert("WitnessHub: Owner should be the sender");
        witnessHub.setStrategyParams(params);
        vm.stopPrank();
    }

    // Pass: update reward for 2 operators first time
    function testSingleUpdateReward() public {
        uint256 chainID = 420;
        uint256 blockBegin = 0;
        uint256 blockEnd = 322;
        Types.BountyRewards[] memory proofRewards = new Types.BountyRewards[](2);
        // Get a list of operator rewards
        proofRewards[0] = Types.BountyRewards({inclusionProofBounties: 5, diligenceProofBounties: 10});
        proofRewards[1] = Types.BountyRewards({inclusionProofBounties: 4, diligenceProofBounties: 8});
        bytes32 rewardHash = bytes32("sadsad");

        vm.startPrank(vm.addr(deployerPrivateKey));
        witnessHub.updateReward(chainID, blockBegin, blockEnd, operatorsList, proofRewards, rewardHash);
        vm.stopPrank();

        assertEq(witnessHub.getOperatorRewardsByChainID(operatorsList[0], chainID).diligenceProofBounties, 10);
        assertEq(witnessHub.getOperatorRewardsByChainID(operatorsList[0], chainID).inclusionProofBounties, 5);
        assertEq(witnessHub.getOperatorRewardsByChainID(operatorsList[1], chainID).diligenceProofBounties, 8);
        assertEq(witnessHub.getOperatorRewardsByChainID(operatorsList[1], chainID).inclusionProofBounties, 4);
    }

    // Fail: update reward for 2 operators first time, not 0 block
    function testSingleUpdateRewardTwo() public {
        uint256 chainID = 420;
        uint256 blockBegin = 69;
        uint256 blockEnd = 322;
        Types.BountyRewards[] memory proofRewards = new Types.BountyRewards[](2);
        // Get a list of operator rewards
        proofRewards[0] = Types.BountyRewards({inclusionProofBounties: 5, diligenceProofBounties: 10});
        proofRewards[1] = Types.BountyRewards({inclusionProofBounties: 4, diligenceProofBounties: 8});
        bytes32 rewardHash = bytes32("sadsad");

        vm.startPrank(vm.addr(deployerPrivateKey));
        vm.expectRevert(bytes("WitnessHub: Incorrect _blockNumBegin"));
        witnessHub.updateReward(chainID, blockBegin, blockEnd, operatorsList, proofRewards, rewardHash);
        vm.stopPrank();

        assertEq(witnessHub.getOperatorRewardsByChainID(operatorsList[0], chainID).diligenceProofBounties, 0);
        assertEq(witnessHub.getOperatorRewardsByChainID(operatorsList[0], chainID).inclusionProofBounties, 0);
        assertEq(witnessHub.getOperatorRewardsByChainID(operatorsList[1], chainID).diligenceProofBounties, 0);
        assertEq(witnessHub.getOperatorRewardsByChainID(operatorsList[1], chainID).inclusionProofBounties, 0);
    }

    // Pass: update reward for 2 operators twice
    function testMultipleUpdateRewardOne() public {
        uint256 chainID = 420;
        uint256 blockBeginFirst = 0;
        uint256 blockEndFirst = 322;
        uint256 blockBeginSecond = 323;
        uint256 blockEndSecond = 420;

        Types.BountyRewards[] memory proofRewards = new Types.BountyRewards[](2);

        // Get a list of operator rewards for first update
        proofRewards[0] = Types.BountyRewards({inclusionProofBounties: 5, diligenceProofBounties: 10});
        proofRewards[1] = Types.BountyRewards({inclusionProofBounties: 4, diligenceProofBounties: 8});
        bytes32 rewardHash = bytes32("sadsad");

        vm.startPrank(vm.addr(deployerPrivateKey));
        witnessHub.updateReward(chainID, blockBeginFirst, blockEndFirst, operatorsList, proofRewards, rewardHash);
        vm.stopPrank();

        assertEq(witnessHub.getOperatorRewardsByChainID(operatorsList[0], chainID).diligenceProofBounties, 10);
        assertEq(witnessHub.getOperatorRewardsByChainID(operatorsList[0], chainID).inclusionProofBounties, 5);
        assertEq(witnessHub.getOperatorRewardsByChainID(operatorsList[1], chainID).diligenceProofBounties, 8);
        assertEq(witnessHub.getOperatorRewardsByChainID(operatorsList[1], chainID).inclusionProofBounties, 4);

        // Get a list of operator rewards for second update
        proofRewards[0] = Types.BountyRewards({inclusionProofBounties: 64, diligenceProofBounties: 22});
        proofRewards[1] = Types.BountyRewards({inclusionProofBounties: 45, diligenceProofBounties: 21});
        bytes32 rewardHashSecond = bytes32("happihappi");

        vm.startPrank(vm.addr(deployerPrivateKey));
        witnessHub.updateReward(
            chainID, blockBeginSecond, blockEndSecond, operatorsList, proofRewards, rewardHashSecond
        );
        vm.stopPrank();

        assertEq(witnessHub.getOperatorRewardsByChainID(operatorsList[0], chainID).diligenceProofBounties, 32);
        assertEq(witnessHub.getOperatorRewardsByChainID(operatorsList[0], chainID).inclusionProofBounties, 69);
        assertEq(witnessHub.getOperatorRewardsByChainID(operatorsList[1], chainID).diligenceProofBounties, 29);
        assertEq(witnessHub.getOperatorRewardsByChainID(operatorsList[1], chainID).inclusionProofBounties, 49);
    }

    // Pass: Update rewards for 2 operators first time then one operator next
    function testMultipleUpdateRewardTwo() public {
        uint256 chainID = 420;
        uint256 blockBeginFirst = 0;
        uint256 blockEndFirst = 322;
        uint256 blockBeginSecond = 323;
        uint256 blockEndSecond = 420;

        // Get a list of operator rewards for first update
        Types.BountyRewards[] memory proofRewards = new Types.BountyRewards[](2);
        proofRewards[0] = Types.BountyRewards({inclusionProofBounties: 5, diligenceProofBounties: 10});
        proofRewards[1] = Types.BountyRewards({inclusionProofBounties: 4, diligenceProofBounties: 8});
        bytes32 rewardHash = bytes32("sadsad");

        vm.startPrank(vm.addr(deployerPrivateKey));
        witnessHub.updateReward(chainID, blockBeginFirst, blockEndFirst, operatorsList, proofRewards, rewardHash);
        vm.stopPrank();

        assertEq(witnessHub.getOperatorRewardsByChainID(operatorsList[0], chainID).diligenceProofBounties, 10);
        assertEq(witnessHub.getOperatorRewardsByChainID(operatorsList[0], chainID).inclusionProofBounties, 5);
        assertEq(witnessHub.getOperatorRewardsByChainID(operatorsList[1], chainID).diligenceProofBounties, 8);
        assertEq(witnessHub.getOperatorRewardsByChainID(operatorsList[1], chainID).inclusionProofBounties, 4);

        // Get a list of operator rewards for second update
        Types.BountyRewards[] memory proofRewardsSecond = new Types.BountyRewards[](1);
        proofRewardsSecond[0] = Types.BountyRewards({inclusionProofBounties: 64, diligenceProofBounties: 22});
        bytes32 rewardHashSecond = bytes32("happihappi");

        address[] memory operatorsListSecond = new address[](1);
        operatorsListSecond[0] = operatorsList[0];
        vm.startPrank(vm.addr(deployerPrivateKey));

        witnessHub.updateReward(
            chainID, blockBeginSecond, blockEndSecond, operatorsListSecond, proofRewardsSecond, rewardHashSecond
        );
        vm.stopPrank();

        assertEq(witnessHub.getOperatorRewardsByChainID(operatorsList[0], chainID).diligenceProofBounties, 32);
        assertEq(witnessHub.getOperatorRewardsByChainID(operatorsList[0], chainID).inclusionProofBounties, 69);
        assertEq(witnessHub.getOperatorRewardsByChainID(operatorsList[1], chainID).diligenceProofBounties, 8);
        assertEq(witnessHub.getOperatorRewardsByChainID(operatorsList[1], chainID).inclusionProofBounties, 4);
    }

    // Fail: Update rewards for 2 operators first time then one operator next with incorrect begin block
    function testMultipleUpdateRewardThree() public {
        uint256 chainID = 420;
        uint256 blockBeginFirst = 0;
        uint256 blockEndFirst = 322;
        uint256 blockBeginSecond = 400;
        uint256 blockEndSecond = 420;

        // Get a list of operator rewards for first update
        Types.BountyRewards[] memory proofRewards = new Types.BountyRewards[](2);
        proofRewards[0] = Types.BountyRewards({inclusionProofBounties: 5, diligenceProofBounties: 10});
        proofRewards[1] = Types.BountyRewards({inclusionProofBounties: 4, diligenceProofBounties: 8});
        bytes32 rewardHash = bytes32("sadsad");

        vm.startPrank(vm.addr(deployerPrivateKey));
        witnessHub.updateReward(chainID, blockBeginFirst, blockEndFirst, operatorsList, proofRewards, rewardHash);
        vm.stopPrank();

        assertEq(witnessHub.getOperatorRewardsByChainID(operatorsList[0], chainID).diligenceProofBounties, 10);
        assertEq(witnessHub.getOperatorRewardsByChainID(operatorsList[0], chainID).inclusionProofBounties, 5);
        assertEq(witnessHub.getOperatorRewardsByChainID(operatorsList[1], chainID).diligenceProofBounties, 8);
        assertEq(witnessHub.getOperatorRewardsByChainID(operatorsList[1], chainID).inclusionProofBounties, 4);

        // Get a list of operator rewards for second update
        Types.BountyRewards[] memory proofRewardsSecond = new Types.BountyRewards[](1);
        proofRewardsSecond[0] = Types.BountyRewards({inclusionProofBounties: 64, diligenceProofBounties: 22});
        bytes32 rewardHashSecond = bytes32("happihappi");

        address[] memory operatorsListSecond = new address[](1);
        operatorsListSecond[0] = operatorsList[0];
        vm.startPrank(vm.addr(deployerPrivateKey));
        vm.expectRevert(bytes("WitnessHub: Incorrect _blockNumBegin"));

        witnessHub.updateReward(
            chainID, blockBeginSecond, blockEndSecond, operatorsListSecond, proofRewardsSecond, rewardHashSecond
        );
        vm.stopPrank();

        assertEq(witnessHub.getOperatorRewardsByChainID(operatorsList[0], chainID).diligenceProofBounties, 10);
        assertEq(witnessHub.getOperatorRewardsByChainID(operatorsList[0], chainID).inclusionProofBounties, 5);
        assertEq(witnessHub.getOperatorRewardsByChainID(operatorsList[1], chainID).diligenceProofBounties, 8);
        assertEq(witnessHub.getOperatorRewardsByChainID(operatorsList[1], chainID).inclusionProofBounties, 4);
    }

    // Fail: update reward for 2 operators first time as non-aggregator
    function testSingleUpdateRewardAsNotAggregator() public {
        uint256 chainID = 420;
        uint256 blockBegin = 0;
        uint256 blockEnd = 322;
        Types.BountyRewards[] memory proofRewards = new Types.BountyRewards[](2);
        // Get a list of operator rewards
        proofRewards[0] = Types.BountyRewards({inclusionProofBounties: 5, diligenceProofBounties: 10});
        proofRewards[1] = Types.BountyRewards({inclusionProofBounties: 4, diligenceProofBounties: 8});
        bytes32 rewardHash = bytes32("sadsad");

        vm.startPrank(watchtowersList[1]);
        vm.expectRevert(bytes("WitnessHub: You are not the aggregator!"));
        witnessHub.updateReward(chainID, blockBegin, blockEnd, operatorsList, proofRewards, rewardHash);
        vm.stopPrank();
        // rewards shouldn't have updated
        assertEq(witnessHub.getOperatorRewardsByChainID(operatorsList[0], chainID).diligenceProofBounties, 0);
        assertEq(witnessHub.getOperatorRewardsByChainID(operatorsList[0], chainID).inclusionProofBounties, 0);
        assertEq(witnessHub.getOperatorRewardsByChainID(operatorsList[1], chainID).diligenceProofBounties, 0);
        assertEq(witnessHub.getOperatorRewardsByChainID(operatorsList[1], chainID).inclusionProofBounties, 0);
    }

    // Fail: update reward with unequal operator list size and rewards list size
    function testSingleUpdateRewardUnequalListSize() public {
        uint256 chainID = 420;
        uint256 blockBegin = 0;
        uint256 blockEnd = 322;
        Types.BountyRewards[] memory proofRewards = new Types.BountyRewards[](2);
        // Get a list of operator rewards
        proofRewards[0] = Types.BountyRewards({inclusionProofBounties: 5, diligenceProofBounties: 10});
        proofRewards[1] = Types.BountyRewards({inclusionProofBounties: 4, diligenceProofBounties: 8});
        bytes32 rewardHash = bytes32("sadsad");

        address[] memory operatorsListNew = new address[](1);
        operatorsListNew[0] = operatorsList[0];
        vm.startPrank(vm.addr(deployerPrivateKey));
        vm.expectRevert(bytes("WitnessHub: unequal operators and reward list length"));
        witnessHub.updateReward(chainID, blockBegin, blockEnd, operatorsListNew, proofRewards, rewardHash);
        vm.stopPrank();
    }

    // Fail: update reward for invalid chain id
    function testSingleUpdateRewardInvalidChainID() public {
        uint256 chainID = 69;
        uint256 blockBegin = 0;
        uint256 blockEnd = 322;
        Types.BountyRewards[] memory proofRewards = new Types.BountyRewards[](2);
        // Get a list of operator rewards
        proofRewards[0] = Types.BountyRewards({inclusionProofBounties: 5, diligenceProofBounties: 10});
        proofRewards[1] = Types.BountyRewards({inclusionProofBounties: 4, diligenceProofBounties: 8});
        bytes32 rewardHash = bytes32("sadsad");

        vm.startPrank(vm.addr(deployerPrivateKey));
        vm.expectRevert(bytes("WitnessHub: Invalid Chain ID"));
        witnessHub.updateReward(chainID, blockBegin, blockEnd, operatorsList, proofRewards, rewardHash);
        vm.stopPrank();
    }

    // Fail: update reward for invalid operator
    function testSingleUpdateRewardInvalidOperator() public {
        uint256 chainID = 420;
        uint256 blockBegin = 0;
        uint256 blockEnd = 322;
        Types.BountyRewards[] memory proofRewards = new Types.BountyRewards[](2);
        // Get a list of operator rewards
        proofRewards[0] = Types.BountyRewards({inclusionProofBounties: 5, diligenceProofBounties: 10});
        proofRewards[1] = Types.BountyRewards({inclusionProofBounties: 4, diligenceProofBounties: 8});
        bytes32 rewardHash = bytes32("sadsad");
        operatorsList[1] = watchtowersList[0];
        vm.startPrank(vm.addr(deployerPrivateKey));
        vm.expectRevert(bytes("WitnessHub: Inactive operator"));
        witnessHub.updateReward(chainID, blockBegin, blockEnd, operatorsList, proofRewards, rewardHash);
        vm.stopPrank();
        assertEq(witnessHub.getOperatorRewardsByChainID(operatorsList[0], chainID).diligenceProofBounties, 0);
        assertEq(witnessHub.getOperatorRewardsByChainID(operatorsList[0], chainID).inclusionProofBounties, 0);
        assertEq(witnessHub.getOperatorRewardsByChainID(operatorsList[1], chainID).diligenceProofBounties, 0);
        assertEq(witnessHub.getOperatorRewardsByChainID(operatorsList[1], chainID).inclusionProofBounties, 0);
    }

    // Pass: verifies setting strategy params as owner
    function testSetStrategyParams() public {
        address strat1Address = address(bytes20(bytes("0xb613e78e2068d7489bb66419fb1cfa11275d14da")));
        IWitnessHub.StrategyParam memory strat1 =
            IWitnessHub.StrategyParam({strategy: IStrategy(strat1Address), multiplier: 2});

        params.push(strat1);
        vm.startPrank(vm.addr(deployerPrivateKey));
        witnessHub.setStrategyParams(params);
        address[] memory strategies = witnessHub.getRestakeableStrategies();
        assertEq(strategies.length,1);
        params.push(strat1);
         witnessHub.setStrategyParams(params);
        strategies = witnessHub.getRestakeableStrategies();
        assertEq(strategies.length,2);  
        params.pop();
        params.pop();
        params.push(strat1);
        witnessHub.setStrategyParams(params);
        strategies = witnessHub.getRestakeableStrategies();
        assertEq(strategies.length,1);  
        vm.stopPrank();
    }
}