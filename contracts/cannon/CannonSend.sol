// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;
pragma experimental ABIEncoderV2;

import "./CannonActivity.sol";

/**
 * @title Nifty Cannon Send functions
 * @author Cliff Hall
 * @notice Allows direct or deferred transfer of NFTs from one sender to one or more recipients.
 * TODO: disallow volleys targeting of addresses behind Rampart
 */
contract CannonSend is CannonActivity {

    /**
     * @notice Fire a single Volley
     * This contract must already be approved as an operator for the NFTs specified in the Volley.
     * @param _volley a valid Volley struct
     */
    function fireVolley(Volley memory _volley) external {
        require(processVolley(_volley), "Volley failed");
    }

    /**
     * @notice Fire multiple Volleys
     * This contract must already be approved as an operator for the NFTs specified in the Volleys.
     * @param _volleys an array of valid Volley structs
     */
    function fireVolleys(Volley[] memory _volleys) external {
        for (uint256 index = 0; index < _volleys.length; index++) {
            Volley memory volley = _volleys[index];
            require(processVolley(volley), "Volley failed");
        }
    }
}