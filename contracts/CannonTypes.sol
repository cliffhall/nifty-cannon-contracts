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
     * @notice Request to fire one or more NFTs out to a single recipient
     */
    struct Volley {
        Mode mode;
        address sender;
        address recipient;
        address tokenContract;
        uint256[] tokenIds;
    }
}