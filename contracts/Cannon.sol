// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.7.4;
pragma experimental ABIEncoderV2;

import "./CannonState.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title Nifty Cannon
 * @author Cliff Hall
 * @notice Allows direct or deferred transfer of NFTs from one sender to one or more recipients.
 * TODO: disallow volleys targeting addresses behind Rampart
 */
contract Cannon is CannonState {

    /**
     * @notice Process a Volley
     * This is the Cannon's central transfer mechanism.
     * It has two operating modes: Airdrop and Will Call.
     * In Airdrop mode, all of the NFTs in the Volley will be transferred to the recipient, sender paying gas.
     * In Will Call mode, the volley will be stored, to be later executed by the recipient, who pays the gas.
     * This contract must already be approved as an operator for the NFTs specified in the Volley.
     * @param volley a valid Volley struct
     */
    function processVolley(Volley memory volley) internal returns (bool success) {

        // Destructure volley props for simplicity
        Mode mode = volley.mode;
        address sender = volley.sender;
        address recipient = volley.recipient;
        IERC721 tokenContract = IERC721(volley.tokenContract);

        // Ensure this contract is an approved operator for the NFTs
        require(tokenContract.isApprovedForAll(sender, address(this)), "Nifty Cannon not approved to transfer sender's NFT's" );

        // Handle the volley
        if (mode == Mode.AIRDROP) {

            // Iterate over the NFTs to be transferred
            for (uint256 index = 0; index < volley.tokenIds.length; index++) {


                    // Get the current token id
                    uint256 nft = volley.tokenIds[index];

                    // Sender pays gas to transfer token directly to recipient wallet
                    tokenContract.safeTransferFrom(sender, recipient, nft);

            }

            } else {

                // Store the volley for the recipient to pickup later
                willCallVolleys[recipient].push(volley);

            }

        return true;
    }

    /**
     * @notice Pick up a Volley
     * There must be one or more Volleys awaiting the recipient
     * This contract must already be approved as an operator for the NFTs specified in the Volley.
     * @param index the index of the volley in the recipient's list of will call volleys
     */
    function pickupVolley(uint256 index) internal returns (bool success) {

        // Verify there are one or more waiting volleys and the specified index is valid
        uint256 length = willCallVolleys[msg.sender].length;
        require(length > 0, "Caller has no volleys to accept.");
        require(index < length, "Volley index out of bounds.");

        // Get the volley and mark it as AIRDROP mode so it will transfer when processed
        Volley memory volley = willCallVolleys[msg.sender][index];
        volley.mode = Mode.AIRDROP;
        require(msg.sender == volley.recipient, "Caller not recipient.");

        // If not the last, replace the current volley with the last volley and pop the array
        if (length != index + 1) {
            willCallVolleys[msg.sender][index] = willCallVolleys[msg.sender][--length];
        }
        willCallVolleys[msg.sender].pop();

        // Process the volley
        require(processVolley(volley), "Volley failed");
        success = true;
    }

    /**
     * @notice Fire a single Volley
     * This contract must already be approved as an operator for the NFTs specified in the Volley.
     * @param volley a valid Volley struct
     */
    function fireVolley(Volley memory volley) external {
        require(processVolley(volley), "Volley failed");
    }

    /**
     * @notice Fire multiple Volleys
     * This contract must already be approved as an operator for the NFTs specified in the Volleys.
     * @param volleys an array of valid Volley structs
     */
    function fireVolleys(Volley[] memory volleys) external {
        for (uint256 index = 0; index < volleys.length; index++) {
            Volley memory volley = volleys[index];
            require(processVolley(volley), "Volley failed");
        }
    }

    /**
     * @notice Receive a specific Volley awaiting the caller
     * There must be one or more Volleys awaiting the recipient
     * This contract must already be approved as an operator for the NFTs specified in the Volley.
     * @param index the index of the volley in the recipient's list of will call volleys
     */
    function receiveVolley(uint256 index) external {

        // Pick up the specified volley
        require(pickupVolley(index), "Will call pickupVolley failed");
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
     * @notice Check for Will Call Volleys
     * @return count the number of volleys awaiting the caller
     */
    function myWillCallCount() public view returns (uint256 count) {
        count = willCallVolleys[msg.sender].length;
    }

}