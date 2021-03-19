// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;
pragma experimental ABIEncoderV2;

import "./CannonTypes.sol";

/**
 * @title Nifty Cannon State
 * @author Cliff Hall
 * @notice Defines the state members maintained by the Cannon contract
 */
contract CannonState is CannonTypes {

    /**
     * @notice Non-transferable volleys by recipient address
     */
    mapping(address => Volley[]) public willCallVolleys;

    /**
     * @notice Transferable tickets by ticketId
     */
    mapping(uint256 => Ticket) public transferableTickets;

    /**
     * @dev Since tickets are burned once used, totalSupply cannot be used for new ticket numbers
     */
    uint256 internal nextTicketNumber = 0;

}
