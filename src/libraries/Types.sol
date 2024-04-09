// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

/// @title Types
/// @notice Contains various types used throughout the WitnessChain contracts
library Types {
    /// @notice BountyRewards representes current bounties awarded to an operator
    ///         bounties awarded for inclusion proofs and diligence proofs are stored separately
    /// @custom:field inclusionProofBounties  Total Bounties awarded for Proof of Inclusion submissions
    /// @custom:field diligenceProofBounties  Total Bounties awarded for Proof of diligence submissions
    struct BountyRewards {
        uint256 inclusionProofBounties;
        uint256 diligenceProofBounties;
    }

    struct ChainRewards {
        uint256 lastUpdateBlock;
        mapping(address => BountyRewards) currentOperatorRewards;
    }

    /// @notice AggProofComitment represents a commitment by the aggregator to the bounties awarded
    ///         to the various watchtowers for the specified chain id, for the specified duration
    ///         in terms on l2 block numbers
    /// @custom:field chainID               chain id of the L2 for which the commitment is being made
    /// @custom:field l2BlockNumberBegin    L2 block number at the start of duration for this commitment
    /// @custom:field l2BlockNumberEnd      L2 block number at the end of the duration for this commitment
    /// @custom:field rewardHash            hash of the reward details
    /// @custom:field submissionBlock       L1 block number when this commitment was made
    struct AggProofCommitment {
        uint256 chainID;
        uint256 l2BlockNumberBegin;
        uint256 l2BlockNumberEnd;
        bytes32 rewardHash;
        uint256 submissionBlock;
    }
}
