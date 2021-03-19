// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;
pragma experimental ABIEncoderV2;

/**
 * @title Nifty Cannon Events
 * @author Cliff Hall
 */
contract CannonEvents {

    /**
     * @notice Event emitted upon successful storage of a will-call volley.
     * @param sender the sender of the volley
     * @param recipient the recipient of the volley
     * @param tokenContract the token contract that minted the NFTs
     * @param tokenIds the ids of NFTs that were transferred
     */
    event VolleyStored(address indexed sender, address indexed recipient, address tokenContract, uint256[] tokenIds);

    /**
     * @notice Event emitted upon successful transfer of a volley, via airdrop or pickup of a will-call.
     * @param sender the sender of the volley
     * @param recipient the recipient of the volley
     * @param tokenContract the token contract that minted the NFTs
     * @param tokenIds the ids of NFTs to be transferred
     */
    event VolleyTransferred(address indexed sender, address indexed recipient, address tokenContract, uint256[] tokenIds);

    /**
     * @notice Event emitted upon successful storage and ticketing of a volley,
     * @param sender the sender of the volley
     * @param recipient the recipient of the ticket
     * @param ticketId the id of the transferable ticket
     * @param tokenContract the token contract that minted the NFTs
     * @param tokenIds the ids of NFTs to be transferred
     */
    event VolleyTicketed(address indexed sender, address indexed recipient, uint256 indexed ticketId, address tokenContract, uint256[] tokenIds);


}