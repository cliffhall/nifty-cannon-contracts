// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.7.4;

import "./CannonTypes.sol";
import "./CannonBase.sol";

/**
 * @title Nifty Cannon State
 * @author Cliff Hall
 * @notice Defines the state members maintained by the Cannon contract
 */
contract CannonState is CannonBase, CannonTypes {

    /**
     * @notice Will Call Volleys for a given recipient
     */
    mapping(address => Volley[]) public willCallVolleys;

}