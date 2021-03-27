// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;
pragma experimental ABIEncoderV2;

import "./CannonState.sol";
import "./CannonActivity.sol";

/**
 * @title Nifty Cannon View Activity
 * @author Cliff Hall
 * @notice View functions that report to the caller about contract state
 */
contract CannonView is CannonActivity {

    /**
     * @notice Check combined count of Will-call Volleys and Tickets
     * @return count the total number of volleys and tickets awaiting the caller
     */
    function myWillCallCount() public view returns (uint256 count) {
        uint256 volleyCount = willCallVolleys[msg.sender].length;
        uint256 ticketCount = balanceOf(msg.sender);
        count = volleyCount + ticketCount;
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
     * @notice Get the caller's transferable tickets
     * @return tickets the tickets awaiting the caller
     */
    function myTickets() public view returns (Ticket[] memory) {
        uint256 ticketCount = balanceOf(msg.sender);
        Ticket[] memory tickets = new Ticket[](ticketCount);
        if (ticketCount > 0) {
            for (uint256 i = 0; i < ticketCount; i++) {
                uint256 ticketId = tokenOfOwnerByIndex(msg.sender, i);
                Ticket memory ticket = transferableTickets[ticketId];
                tickets[i] = ticket;
            }
        }
        return tickets;
    }

}