// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.7.4;
pragma experimental ABIEncoderV2;

import "./CannonState.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @title Nifty Cannon Will-call Ticket Factory
 * @author Cliff Hall
 * @notice Manages the Cannon-native NFTs that represent will-call tickets.
 * The current holder of a will-call ticket can pick up a volley originally intended for another recipient.
 */
contract TicketFactory is CannonState, ERC721 {

    constructor() ERC721(TOKEN_NAME, TOKEN_SYMBOL) {}

    string public constant TOKEN_NAME = "Nifty Cannon Will-call Ticket";
    string public constant TOKEN_SYMBOL = "FODDER";

    /**
     * Mint a will-call ticket
     * @param _owner the address that will own the ticket
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
     * Burn a will-call ticket
     * @param _ticketId the address that will own the ticket
     */
    function burnTicket(uint256 _ticketId)
    internal
    {
        _burn(_ticketId);
    }

}