// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import { Initializable } from "@openzeppelin-upgrades/contracts/proxy/utils/Initializable.sol";
import { OwnableUpgradeable } from "@openzeppelin-upgrades/contracts/access/OwnableUpgradeable.sol";
import { PausableUpgradeable } from "@openzeppelin-upgrades/contracts/security/PausableUpgradeable.sol";
import { UUPSUpgradeable } from "@openzeppelin-upgrades/contracts/proxy/utils/UUPSUpgradeable.sol";

import { IDiligenceProofManager } from "../interfaces/IDiligenceProofManager.sol";
import { IOperatorRegistry } from "./../interfaces/IOperatorRegistry.sol";
import { IL2ChainMapping } from "./../interfaces/IL2ChainMapping.sol";

import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";


/** @title  DiligenceProofManager
 *  @notice The DiligenceProofManager Contract contains functionality for
 *          miners (aka WatchTowers) to submit (mine) their Proofs of Diligence
 *          for a Bounty Period (which is the period between 2 L2 Txn Batch 
 *          submissions). After the next L2 output state root is posted on L1, 
 *          the bounty is rewarded to the miner. Bounties are given for every 
 *          L2 Output (L2 Block). The terms WatchTower and Miner might be used 
 *          interchangeably.
*/
contract DiligenceProofManager is 
            IDiligenceProofManager, 
            Initializable, 
            OwnableUpgradeable, 
            PausableUpgradeable,
            UUPSUpgradeable
        {
    using ECDSA for bytes32;

    IOperatorRegistry public registry;

    IL2ChainMapping public l2ChainMapping;

    // chainID => current bounty for chainID
    // One for pod, one for poi
    mapping(uint256 => uint256) private currentPODBountiesForRollup;
    mapping(uint256 => uint256) private currentPOIBountiesForRollup;

    // miner address => L2 chainID => latest L2 block claimed by the miner for PoD
    mapping(address => mapping(uint256 => uint256)) private minerLatestClaimedBlockPoD;

    // miner address => L2 chainID => latest L2 block claimed by the miner for PoI
    mapping(address => mapping(uint256 => uint256)) private minerLatestClaimedBlockPoI;

    // L2 chainID => L2 block number => Bounty
    // One for pod and one for poi
    mapping(uint256 => mapping(uint256 => Bounty)) private podBounties;
    mapping(uint256 => mapping(uint256 => Bounty)) private poiBounties;

    // chain id => range
    // range of blocks for chain id for which to aggregate bounties
    mapping(uint256 => uint256) private chainIDRange;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
                        IOperatorRegistry _registry,
                        IL2ChainMapping _l2ChainMapping
        ) public initializer {
        registry = _registry;
        l2ChainMapping = _l2ChainMapping;
        __Ownable_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
    }

    /// @notice pause the contract
    function pause() public whenNotPaused onlyOwner {
        super._pause();
    }

    /// @notice unpause the contract
    function unpause() public whenPaused onlyOwner {
        super._unpause();
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyOwner
        override
    {}

    /** 
     * @notice Set the total POD bounty for the chain id
     * @param _claimBounties is the bounties set
     */
    function setPODClaimBounties
                    (
                        uint256 _chainID,
                        uint256 _claimBounties
                    ) 
                    external whenNotPaused onlyOwner {
            
            require (l2ChainMapping.isValidChainID(_chainID), "WitnessHub: Invalid Chain ID");
            require (_claimBounties > 0, "WitnessHub: _claimBounties should be > 0");

            currentPODBountiesForRollup[_chainID] = _claimBounties;

            emit NewPODBountyInitialized(_chainID, _claimBounties);
        }

    /** 
     * @notice Set the total POI bounty for the chain id
     * @param _claimBounties is the bounties set
     */
    function setPOIClaimBounties
                    (
                        uint256 _chainID,
                        uint256 _claimBounties
                    ) 
                    external whenNotPaused onlyOwner {
            
            require (l2ChainMapping.isValidChainID(_chainID), "WitnessHub: Invalid Chain ID");
            require (_claimBounties > 0, "WitnessHub: _claimBounties should be > 0");

            currentPOIBountiesForRollup[_chainID] = _claimBounties;

            emit NewPOIBountyInitialized(_chainID, _claimBounties);
        }

    /** 
     * @notice Returns the range of blocks for which to 
     * aggregate bounties for a chain is
     * @param _chainID id of chain for which to update range
     */
    function getRangeForChainID(uint256 _chainID) external view returns(uint256) {
            
        require (l2ChainMapping.isValidChainID(_chainID), "WitnessHub: Invalid Chain ID");
            
	    if (chainIDRange[_chainID] > 0) {
		    return chainIDRange[_chainID];
	    }

	    // the range for _chainID does not exist; return default value of 100
	    return 100;
    }

    /** 
     * @notice Updates the range of blocks for which to aggregate bounties
     * @param _chainID id of chain for which to update range
     * @param _range range
     */
    function updateRangeForChainID
                    (
                        uint256 _chainID,
                        uint256 _range
                    ) 
                    external whenNotPaused onlyOwner {
            
            require (l2ChainMapping.isValidChainID(_chainID), "WitnessHub: Invalid Chain ID");
            
	    chainIDRange[_chainID] = _range;
     }
    /**
     * @notice Validates proof is signed by transaction sender
     * @param _proof poi/pod proof
     * @param _signatureProof signed proof
     */
     function validateSigner
     		(
			bytes memory _proof,
			bytes memory _signatureProof
		)
		internal view {

	        // 1. get the messageHash
            bytes32 messageHash = keccak256(abi.encodePacked(_proof));

            // 2. get the ethSignedMessageHash
            bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();

            // 3. recover signer from ethSignedMessageHash and signature
            address signer = ethSignedMessageHash.recover(_signatureProof);

            require(signer == msg.sender, "WitnessHub: Signer is not the txn originator");
     }

    /** 
     * @notice Mine the total bounty for a particular L2 block Number 
     * called by a WatchTower
     * @param _chainID - id of chain for which bounty is being mined
     * @param _l2BlockNumber L2 block number for which the bounty is mined
     * @param _proof Proof of Diligence/Inclusion
     * @param _signatureProof signed Proof of Diligence/Inclusion
     * @param proofType - 0 if it is POD proof, 1 if it is POI proof
     */
    // Note bool is more expensive than uint256, so setting proofType as 
    // uint256 instead of bool
    // TODO: Check _l2BlockNumber is valid
    function submitProof
                    (
                        uint256 _chainID,
                        uint256 _l2BlockNumber,
                        bytes  	calldata _proof,
                        bytes  	calldata _signatureProof,
			            uint256 proofType
                    )
                    internal {
	    
            require(registry.isValidWatchtower(msg.sender), "WitnessHub: Invalid Watchtower");

            validateSigner(_proof, _signatureProof);

            
            Bounty storage bounty;

            if (proofType == 0) {

                require(minerLatestClaimedBlockPoD[msg.sender][_chainID] != _l2BlockNumber, "WitnessHub: Miner has already submitted claim");
                bounty = podBounties[_chainID][_l2BlockNumber];
                bounty.claimBounties = currentPODBountiesForRollup[_chainID];
                minerLatestClaimedBlockPoD[msg.sender][_chainID] = _l2BlockNumber;   

                emit NewPODBountyClaimed(_chainID, _l2BlockNumber, _signatureProof, bounty.claimBounties, msg.sender, block.timestamp);
            
            } else if (proofType == 1) {

                require(minerLatestClaimedBlockPoI[msg.sender][_chainID] != _l2BlockNumber, "WitnessHub: Miner has already submitted claim");
                bounty = poiBounties[_chainID][_l2BlockNumber];
                bounty.claimBounties = currentPOIBountiesForRollup[_chainID];
                minerLatestClaimedBlockPoI[msg.sender][_chainID] = _l2BlockNumber;   
                emit NewPOIBountyClaimed(_chainID, _l2BlockNumber, _signatureProof, bounty.claimBounties, msg.sender, block.timestamp);
            
            } else {
            
                revert("Invalid proof type");
            
            }
            
            // Store the proofs for fraud proof detection
            // signed proof can also be used for reward computation
            bounty.minerStateRoots[msg.sender] = _proof;
            bounty.minerSignatures[msg.sender] = _signatureProof;
    }

    /**
     * @notice Submits bounty for POD. Internally calls submitProof
     * called by a WatchTower
     * @param _chainID id of chain for which bounty is being submitted
     * @param _l2BlockNumber L2 block number for which the bounty is mined
     * @param _proofOfDiligence Proof of Diligence
     * @param _signatureProofOfDiligence signed Proof of Diligence
     */

    function submitPODProof
                    (
                        uint256          _chainID,
                        uint256          _l2BlockNumber,
                        bytes  calldata  _proofOfDiligence,
                        bytes  calldata  _signatureProofOfDiligence
                    )
                    external virtual whenNotPaused {

	// Calls submitProof with last argument as 0
	submitProof(_chainID, _l2BlockNumber, _proofOfDiligence, _signatureProofOfDiligence, 0);
    }

    /**
     * @notice Submits bounty for POI. Internally calls submitProof
     * called by a WatchTower
     * @param _chainID id of chain for which bounty is being submitted
     * @param _l2BlockNumber L2 block number for which the bounty is mined
     * @param _proofOfInclusion Proof of Diligence
     * @param _signatureProofOfInclusion signed Proof of Diligence
     */

    function submitPOIProof
                    (
                        uint256          _chainID,
                        uint256          _l2BlockNumber,
                        bytes  calldata  _proofOfInclusion,
                        bytes  calldata  _signatureProofOfInclusion
                    )
                    external virtual whenNotPaused {

	// Calls submitProof with last argument as false
	submitProof(_chainID, _l2BlockNumber, _proofOfInclusion, _signatureProofOfInclusion, 1);
    }


    /** 
     * @notice Get the ClaimBounties
     */
    function getPODClaimBounties(uint256 _chainID) external view returns (uint256) {
        return currentPODBountiesForRollup[_chainID];
    }

    /** 
     * @notice Get the ClaimBounties
     */
    function getPOIClaimBounties(uint256 _chainID) external view returns (uint256) {
        return currentPOIBountiesForRollup[_chainID];
    }

    /** 
     * @notice Get the Intermediate StateRoots posted by the Miner
     */
    function getPODMinerStateRoots(uint256 _chainID, uint256 _l2BlockNumber, address _miner) public view returns (bytes memory) {
        require(_l2BlockNumber > 0, "WitnessHub: L2 Block Number should be greater than 0");
        require(_miner != address(0), "WitnessHub: Invalid Address");
        return podBounties[_chainID][_l2BlockNumber].minerStateRoots[_miner];
    }

    /** 
     * @notice Get the Intermediate StateRoots posted by the Miner
     */
    function getPOIMinerStateRoots(uint256 _chainID, uint256 _l2BlockNumber, address _miner) public view returns (bytes memory) {
        require(_l2BlockNumber > 0, "WitnessHub: L2 Block Number should be greater than 0");
        require(_miner != address(0), "WitnessHub: Invalid Address");
        return poiBounties[_chainID][_l2BlockNumber].minerStateRoots[_miner];
    }

    /// @notice Sets L2ChainMapping
    function setL2ChainMapping(IL2ChainMapping _l2ChainMapping) external onlyOwner {
        l2ChainMapping = _l2ChainMapping;
    }

    /// @notice Sets OperatorRegistry
    function setOperatorRegistry(IOperatorRegistry _registry) external onlyOwner {
        registry = _registry;
    }
}
