// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;
pragma experimental ABIEncoderV2;

import "./CannonState.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

/**
 * @title Nifty Cannon Transferable Ticket Factory
 * @author Cliff Hall
 * @notice Manages the Cannon-native NFTs that represent transferable tickets.
 * Only the current holder of a ticket can claim the associated nifties.
 */
contract CannonTicket is CannonState, ERC721Enumerable {

    constructor() ERC721(TOKEN_NAME, TOKEN_SYMBOL) {}

    string public constant TOKEN_NAME = "Nifty Cannon Transferable Ticket";
    string public constant TOKEN_SYMBOL = "FODDER";

    /**
     * Mint a ticket
     * @param _owner the address that will own the ticket
     * @return ticketId the token id of the ticket
     */
    function mintTicket(address _owner)
    internal
    returns (uint256 ticketId) {
        ticketId = nextTicketNumber;
        nextTicketNumber = nextTicketNumber + 1;
        _mint(_owner, ticketId);
        return ticketId;
    }

    /**
     * Burn a ticket
     * @param _ticketId the ticket to burn
     */
    function burnTicket(uint256 _ticketId)
    internal
    {
        _burn(_ticketId);
    }
}