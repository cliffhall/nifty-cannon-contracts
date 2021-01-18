// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;
pragma experimental ABIEncoderV2;

import "./CannonState.sol";
import "./TicketFactory.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

/**
 * @title Nifty Cannon
 * @author Cliff Hall
 * @notice Allows direct or deferred transfer of NFTs from one sender to one or more recipients.
 * TODO: disallow volleys targeting of addresses behind Rampart
 */
contract Cannon is TicketFactory {

    using SafeMath for uint256;

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
     * @param ticketId the id of the transferable will-call ticket
     * @param tokenContract the token contract that minted the NFTs
     * @param tokenIds the ids of NFTs to be transferred
     */
    event VolleyTicketed(address indexed sender, address indexed recipient, uint256 indexed ticketId, address tokenContract, uint256[] tokenIds);

    /**
     * @notice Process a Volley
     * This is the Cannon's central transfer mechanism.
     * It has two operating modes: Airdrop and Will-call.
     * In Airdrop mode, all of the NFTs in the Volley will be transferred to the recipient, sender paying gas.
     * In Will-call mode, the volley will be stored, to be later executed by the recipient, who pays the gas.
     * This contract must already be approved as an operator for the NFTs specified in the Volley.
     * @param _volley a valid Volley struct
     */
    function processVolley(Volley memory _volley) internal returns (bool success) {

        // Destructure volley props for simplicity
        Mode mode = _volley.mode;
        address sender = _volley.sender;
        address recipient = _volley.recipient;
        IERC721 tokenContract = IERC721(_volley.tokenContract);

        // Ensure this contract is an approved operator for the NFTs
        require(tokenContract.isApprovedForAll(sender, address(this)), "Nifty Cannon not approved to transfer sender's NFT's" );

        // Handle the volley
        if (mode == Mode.AIRDROP) {

            // Iterate over the NFTs to be transferred
            for (uint256 index = 0; index < _volley.tokenIds.length; index++) {

                // Get the current token id
                uint256 nft = _volley.tokenIds[index];

                // Sender pays gas to transfer token directly to recipient wallet
                tokenContract.safeTransferFrom(sender, recipient, nft);

            }

            // Emit VolleyTransferred event
            emit VolleyTransferred(sender, recipient, _volley.tokenContract, _volley.tokenIds);


        } else if (mode == Mode.WILLCALL) {

            // Store the volley for the recipient to pickup later
            willCallVolleys[recipient].push(_volley);

            // Emit VolleyTransferred event
            emit VolleyStored(sender, recipient, _volley.tokenContract, _volley.tokenIds);

        } else if (mode == Mode.TICKET) {

            // Mint a transferable will-call ticket
            uint256 ticketId = mintTicket(recipient);
            Ticket memory ticket = Ticket(_volley.sender, _volley.tokenContract, ticketId, _volley.tokenIds);
            willCallTickets[ticketId] = ticket;

            // Emit VolleyTicketed event
            emit VolleyTicketed(sender, recipient, ticketId, _volley.tokenContract, _volley.tokenIds);

        }

        return true;
    }

    /**
     * @notice Pick up a Volley
     * There must be one or more Volleys awaiting the recipient
     * This contract must already be approved as an operator for the NFTs specified in the Volley.
     * @param _index the index of the volley in the recipient's list of will-call volleys
     */
    function pickupVolley(uint256 _index) internal returns (bool success) {

        // Verify there are one or more waiting volleys and the specified index is valid
        uint256 length = willCallVolleys[msg.sender].length;
        require(length > 0, "Caller has no volleys to accept.");
        require(_index < length, "Volley index out of bounds.");

        // Get the volley and mark it as AIRDROP mode so it will transfer when processed
        Volley memory volley = willCallVolleys[msg.sender][_index];
        volley.mode = Mode.AIRDROP;
        require(msg.sender == volley.recipient, "Caller not recipient.");

        // If not the last, replace the current volley with the last volley and pop the array
        if (length != _index + 1) {
            willCallVolleys[msg.sender][_index] = willCallVolleys[msg.sender][--length];
        }
        willCallVolleys[msg.sender].pop();

        // Process the volley
        require(processVolley(volley), "Volley failed");
        success = true;
    }

    /**
     * @notice Pick up a transferable will-call volley
     * The caller must own the given ticket (an NFT)
     * This contract must already be approved as an operator for the NFTs specified in the Volley.
     * @param _ticketId the id of the transferable will-call ticket
     */
    function pickupTicket(uint256 _ticketId) internal returns (bool success) {

        // Verify that the ticket exists and hasn't been claimed
        require(_ticketId < nextTicketNumber, "Invalid ticket id.");
        require(_exists(_ticketId), "Ticket has already been claimed.");

        // Verify that caller is the holder of the ticket
        require(msg.sender == ownerOf(_ticketId), "Caller is not the owner of the ticket.");

        // Create volley from the ticket
        // 1. mark it as AIRDROP mode so it will transfer when processed
        // 2. set recipient to caller
        Volley memory volley;
        volley.mode = Mode.AIRDROP;
        volley.sender = willCallTickets[_ticketId].sender;
        volley.recipient = msg.sender;
        volley.tokenContract = willCallTickets[_ticketId].tokenContract;
        volley.tokenIds = willCallTickets[_ticketId].tokenIds;

        // Burn the ticket
        burnTicket(_ticketId);

        // Process the volley
        require(processVolley(volley), "Volley failed");
        success = true;
    }

    /**
     * @notice Fire a single Volley
     * This contract must already be approved as an operator for the NFTs specified in the Volley.
     * @param _volley a valid Volley struct
     */
    function fireVolley(Volley memory _volley) external {
        require(processVolley(_volley), "Volley failed");
    }

    /**
     * @notice Fire multiple Volleys
     * This contract must already be approved as an operator for the NFTs specified in the Volleys.
     * @param _volleys an array of valid Volley structs
     */
    function fireVolleys(Volley[] memory _volleys) external {
        for (uint256 index = 0; index < _volleys.length; index++) {
            Volley memory volley = _volleys[index];
            require(processVolley(volley), "Volley failed");
        }
    }

    /**
     * @notice Receive a specific Volley awaiting the caller
     * There must be one or more Volleys awaiting the recipient
     * This contract must already be approved as an operator for the NFTs specified in the Volley.
     * @param _index the index of the volley in the recipient's list of will-call volleys
     */
    function receiveVolley(uint256 _index) external {

        // Pick up the specified volley
        require(pickupVolley(_index), "Will call pickupVolley failed");
    }

    /**
     * @notice Receive all Volleys awaiting the caller
     * There must be one or more Volleys awaiting the caller
     * This contract must already be approved as an operator for the NFTs specified in the Volley.
     */
    function receiveAllVolleys() external {

        // Get the first volley and process it, looping until all volleys are picked up
        while(willCallVolleys[msg.sender].length > 0) {
            require(pickupVolley(0), "Will call pickupVolley failed");
        }
    }

    /**
     * @notice Receive a specific Volley awaiting the caller
     * There must be one or more Volleys awaiting the recipient
     * This contract must already be approved as an operator for the NFTs specified in the Volley.
     * @param _ticketId the id of the transferable will-call ticket
     */
    function claimTicket(uint256 _ticketId) external {

        // Claim the specified ticket
        require(pickupTicket(_ticketId), "Ticket claim failed");

    }

    /**
     * @notice Claim all Tickets the caller owns
     * Caller must own one or more Tickets
     * This contract must already be approved as an operator for the NFTs specified in the Volley.
     */
    function claimAllTickets() external {

        // Caller must own at least one ticket
        require(balanceOf(msg.sender) > 0, "Caller owns no tickets");

        // Get the first ticket and process it, looping until all volleys are picked up
        while(balanceOf(msg.sender) > 0) {
            require(pickupTicket(tokenOfOwnerByIndex(msg.sender, 0)), "Ticket claim failed");
        }

    }

    /**
     * @notice Check combined count of Will-call Volleys and Tickets
     * @return count the total number of volleys and tickets awaiting the caller
     */
    function myWillCallCount() public view returns (uint256 count) {
        uint256 volleyCount = willCallVolleys[msg.sender].length;
        uint256 ticketCount = balanceOf(msg.sender);
        count = volleyCount.add(ticketCount);
    }

    /**
     * @notice Get the caller's will-call volleys
     * @return tickets the volleys awaiting the caller
     */
    function myVolleys() public view returns (Volley[] memory) {
        uint256 volleyCount = willCallVolleys[msg.sender].length;
        Volley[] memory volleys = new Volley[](volleyCount);
        if (volleyCount > 0) {
            for (uint256 i = 0; i < volleyCount; i++) {
                Volley memory volley = willCallVolleys[msg.sender][i];
                volleys[i] = volley;
            }
        }
        return volleys;
    }

    /**
     * @notice Get the caller's transferable will-call tickets
     * @return tickets the tickets awaiting the caller
     */
    function myTickets() public view returns (Ticket[] memory) {
        uint256 ticketCount = balanceOf(msg.sender);
        Ticket[] memory tickets = new Ticket[](ticketCount);
        if (ticketCount > 0) {
            for (uint256 i = 0; i < ticketCount; i++) {
                uint256 ticketId = tokenOfOwnerByIndex(msg.sender, i);
                Ticket memory ticket = willCallTickets[ticketId];
                tickets[i] = ticket;
            }
        }
        return tickets;
    }

}