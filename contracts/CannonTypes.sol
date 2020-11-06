// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.7.4;

/**
 * @title Nifty Cannon Types
 * @author Cliff Hall
 * @notice Defines the data types used by the Cannon contract
 */
contract CannonTypes {

    /**
     * @notice Mode of operation
     */
    enum Mode {
        AirDrop,
        WillCall
    }

    /**
     * @notice Target one recipient with one or more NFTs
     */
    struct Volley {
        Mode mode;
        address sender;
        address recipient;
        address tokenContract;
        uint256[] tokenIds;
    }

    /**
     * @notice Target multiple recipients with one or more NFTs each
     */
    struct Fusillade {
        Mode mode;
        Volley[] volleys;
    }

}