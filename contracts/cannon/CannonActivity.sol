// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;
pragma experimental ABIEncoderV2;

import "./CannonEvents.sol";
import "./CannonTicket.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

/**
 * @title Nifty Cannon Activity
 * @author Cliff Hall
 * @dev Volley activities associated with airdrop, will-call, and ticket modes
 */
contract CannonActivity is CannonEvents, CannonTicket {

    /**
     * @notice Process a Volley
     * This is the Cannon's central transfer mechanism.
     * It has three operating modes: Airdrop and Will-call.
     * In Airdrop mode, all of the NFTs in the Volley will be transferred to the recipient, sender paying gas.
     * In Will-call mode, the volley will be stored, to be later executed by the recipient, who pays the gas.
     * In Ticket mode, a transferable ticket NFT will be created and sent to the recipient's wallet.
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
        require(tokenContract.isApprovedForAll(sender, address(this)), "Nifty Cannon not approved to transfer sender's NFTs" );

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

            // Mint a transferable ticket
            uint256 ticketId = mintTicket(recipient);
            Ticket memory ticket = Ticket(_volley.sender, _volley.tokenContract, ticketId, _volley.tokenIds);
            transferableTickets[ticketId] = ticket;

            // Emit VolleyTicketed event
            emit VolleyTicketed(sender, recipient, ticketId, _volley.tokenContract, _volley.tokenIds);

        }

        return true;
    }

}