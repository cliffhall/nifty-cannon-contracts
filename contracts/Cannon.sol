// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.7.4;
pragma experimental ABIEncoderV2;

import "./CannonState.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title Nifty Cannon
 * @author Cliff Hall
 * TODO: disallow volleys targeting addresses behind Rampart
 */
contract Cannon is CannonState {

    function fireVolley(Volley memory volley) internal returns (bool success) {

        // Get props
        Mode mode = volley.mode;
        address sender = volley.sender;
        address recipient = volley.recipient;
        IERC721 tokenContract = IERC721(volley.tokenContract);

        require(tokenContract.isApprovedForAll(sender, address(this)), "Nifty Cannon not approved to transfer sender's NFT's" );

        // Iterate over all token ids to be transferred
        for (uint256 index = 0; index < volley.tokenIds.length; index++) {

            uint256 nft = volley.tokenIds[index];

            // Handle the volley as Airdrop or WillCall
            if (mode == Mode.AirDrop) {

                // Sender pays gas to transfer token directly to recipient wallet
                tokenContract.safeTransferFrom(sender, recipient, nft);

            } else {

                // When recipient eventually accepts, they will pay for the airdrop
                volley.mode = Mode.AirDrop;

                // Store the volley
                willCallVolleys[recipient].push(volley);

            }

        }

        return true;
    }

    function fireToOne(Volley memory volley) external {
        require(fireVolley(volley), "Volley failed");
    }

    function fireToMany(Volley[] memory volleys) external {
        for (uint256 index = 0; index < volleys.length; index++) {
            Volley memory volley = volleys[index];
            require(fireVolley(volley), "Volley failed");
        }
    }

    function receiveVolley(uint256 index) external {
        uint256 length = willCallVolleys[msg.sender].length;
        require(length > 0, "Caller has no volleys to accept.");
        require(index < length, "Volley index out of bounds.");
        Volley memory volley = willCallVolleys[msg.sender][index];
        if (length != index + 1) {
            willCallVolleys[msg.sender][index] = willCallVolleys[msg.sender][--length];
        }
        willCallVolleys[msg.sender].pop();
        require(fireVolley(volley), "Volley failed");
    }

    function receiveAllVolleys() external {
        uint256 length = willCallVolleys[msg.sender].length;
        require(length > 0, "Caller has no volleys to accept.");
        uint256 index = 0;
        Volley memory volley;
        do {
            //this.receiveVolley(0);
            volley = willCallVolleys[msg.sender][index];
            if (length != index + 1) {
                willCallVolleys[msg.sender][index] = willCallVolleys[msg.sender][--length];
            }
            willCallVolleys[msg.sender].pop();
            require(fireVolley(volley), "Volley failed");
            length = willCallVolleys[msg.sender].length;
        } while (willCallVolleys[msg.sender].length > 0);
    }

}