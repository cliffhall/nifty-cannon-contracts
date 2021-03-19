// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;
pragma experimental ABIEncoderV2;

/**
 * @title Nifty Cannon Types
 * @author Cliff Hall
 * @notice Defines the data types used by the Cannon contract
 */
contract CannonTypes {

    /**
     * @notice Mode of operation
     */
    enum Mode {
        AIRDROP,
        WILLCALL,
        TICKET
    }

    /**
     * @notice Request to fire one or more NFTs out to a single recipient
     */
    struct Volley {
        Mode mode;
        address sender;
        address recipient;
        address tokenContract;
        uint256[] tokenIds;
    }

    /**
     * @notice transferable ticket
     */
    struct Ticket {
        address sender;
        address tokenContract;
        uint256 ticketId;
        uint256[] tokenIds;
    }
}