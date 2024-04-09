// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @dev collection of common functions related to watchtower contracts
 */
library Common {
    using ECDSA for bytes32;

    /**
     * @notice Recover a signer address from message and signature using ECDSA operations
     * @param message original message
     * @param signature signature for the eth signed message
     * @return signer recovered signer
     */
    function recoverSigner(bytes calldata message, bytes calldata signature) external pure returns (address signer) {
        // 1. get the messageHash
        bytes32 messageHash = keccak256(abi.encodePacked(message));

        // 2. get the ethSignedMessageHash
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();

        // 3. recover signer from ethSignedMessageHash and signature
        signer = ethSignedMessageHash.recover(signature);

        return signer;
    }
    
}