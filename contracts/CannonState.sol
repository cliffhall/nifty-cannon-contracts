// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;
pragma experimental ABIEncoderV2;

import "./CannonTypes.sol";
import "./CannonBase.sol";

/**
 * @title Nifty Cannon State
 * @author Cliff Hall
 * @notice Defines the state members maintained by the Cannon contract
 */
contract CannonState is CannonBase, CannonTypes {

    /**
     * @notice Non-transferable will-call volleys that can only be picked up by a specific recipient
     */
    mapping(address => Volley[]) public willCallVolleys;

    /**
     * @notice Transferable will-call tickets
     */
    mapping(uint256 => Ticket) public willCallTickets;

    /**
     * @dev Since tickets are burned once used, totalSupply cannot be used for new ticket numbers
     */
    uint256 internal nextTicketNumber = 0;

}
