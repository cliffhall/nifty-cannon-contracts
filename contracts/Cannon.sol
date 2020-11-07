// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.7.4;
pragma experimental ABIEncoderV2;

import "./CannonState.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title Nifty Cannon
 * @author Cliff Hall
 */
contract NiftyCannon is CannonState {

    function fireVolley(Volley memory volley) internal returns (bool success) {

        // Iterate over all token ids to be transferred
        for (uint256 index = 0; index < volley.tokenIds.length; index++) {

            address sender = volley.sender;
            address recipient = volley.recipient;
            uint256 nft = volley.tokenIds[index];
            IERC721 tokenContract = IERC721(volley.tokenContract);

            // Handle the volley as Airdrop or WillCall
            if (volley.mode == Mode.AirDrop) {

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

    function fireToMany(Volley[] memory fusillade) external {
        for (uint256 index = 0; index < fusillade.length; index++) {
            Volley memory volley = fusillade[index];
            require(fireVolley(volley), "Volley failed");
        }
    }

    function acceptVolley(uint256 index) external {
        uint256 length = willCallVolleys[msg.sender].length;
        require(length > 0, "Caller has no volleys to accept.");
        require(index < length);
        Volley memory volley = willCallVolleys[msg.sender][index];
        if (length != index + 1) {
            willCallVolleys[msg.sender][index] = willCallVolleys[msg.sender][--length];
        }
        willCallVolleys[msg.sender].pop();
        require(fireVolley(volley), "Volley failed");
    }

    function acceptAllVolleys() external {
        uint256 length = willCallVolleys[msg.sender].length;
        require(length > 0, "Caller has no volleys to accept.");
        do {
            this.acceptVolley(0);
        } while (willCallVolleys[msg.sender].length > 0);
    }

}