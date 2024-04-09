// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

interface IDiligenceProofManager {
    
    /**
     * @notice Represents a Bounty.
     * @custom:field amount    Amount set for the bounty.
     * @custom:field minerStateRoots Mapping of watchtowers to the respective submissions of the Output States.
     * @custom:field winner    Miner who won the Bounty for the L2 block.
     * @custom:field status    Current Status of the Bounty.
     */
    struct Bounty {
        uint256 claimBounties;
        mapping(address => bytes) minerStateRoots;
        mapping(address => bytes) minerSignatures;
    }

    // Event for every POD Bounty Initialized by the Owner
    event NewPODBountyInitialized(
                                uint256           _chainID,
                                uint256           _claimBounties
                              );

    // Event for every POD Bounty Initialized by the Owner
    event NewPOIBountyInitialized(
                                uint256           _chainID,
                                uint256           _claimBounties
                              );


    // Event for every POD Bounty claimed by the Miner
    event NewPODBountyClaimed( 
                               uint256  indexed   _chainID,
                               uint256  indexed   _l2BlockNumber, 
			       bytes		  _signatureProofOfDiligence, 
                               uint256            _claimBounties,
                               address  indexed   _miner,
			       uint256		  _timestamp
                          );

    // Event for every POI Bounty claimed by the Miner
    event NewPOIBountyClaimed( 
                               uint256  indexed   _chainID,
                               uint256  indexed   _l2BlockNumber, 
			       bytes		  _signatureProofOfInclusion,
                               uint256            _claimBounties,
                               address  indexed   _miner,
			       uint256		  _timestamp
                          );

    event LogDebugging(string logMessage);

  function setPODClaimBounties(
                      uint256 _chainID,
                      uint256 _claimBounties
                    ) external;
  
  function setPOIClaimBounties(
                      uint256 _chainID,
                      uint256 _claimBounties
                    ) external;

  
  function submitPODProof(
                        uint256          _chainID,
                        uint256          _l2BlockNumber,
                        bytes  calldata  _proofOfDiligence,
                        bytes  calldata  _signatureProofOfDiligence
                      ) external;

  function submitPOIProof(
                        uint256          _chainID,
                        uint256          _l2BlockNumber,
                        bytes  calldata  _proofOfDiligence,
                        bytes  calldata  _signatureProofOfDiligence
                      ) external;

}
