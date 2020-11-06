// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.7.4;

import "./CannonState.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title Nifty Cannon
 * @author Cliff Hall
 */
contract NiftyCannon is CannonState {

    function fireVolley(Volley volley) internal returns (bool success) {

        console.log("Firing volley of %s NFTs to %s", volley.tokenIds.length, volley.recipient);

        // Iterate over all token ids to be transferred
        for (uint256 index = 0; index < volley.tokenIds.length; index++) {

            address sender = volley.sender;
            address recipient = volley.recipient;
            uint256 nft = volley.tokenIds[index];
            IERC721 tokenContract = IERC721(volley.tokenContract);

            // All or nothing. revert entire operation if any NFT fails to transfer
            require(tokenContract.safeTransferFrom(sender, recipient, nft), "Transfer failed.");
        }

        return true;
    }


    function airdropToOneTarget(Volley volley) external
    {
        console.log("Airdrop %s NFTs to %s", volley.tokenIds.length, volley.recipient);
        fireVolley(volley);
    }

    function airdropToManyTargets(Fusillade fusillade) external
    {
        console.log("Airdrop to %s recipients", fusillade.length);
        for (uint256 index = 0; index < fusillade.length; index++) {
            Volley volley = fusillade[index];
            fireVolley(volley);
        }

    }



}