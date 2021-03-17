// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;
pragma experimental ABIEncoderV2;

import "../Cannon.sol";

/**
 * @title Nifty Cannon Facet
 * @author Cliff Hall
 * @notice Allows direct or deferred transfer of NFTs from one sender to one or more recipients.
 * @dev Just extends the Cannon contract to be deployed as a diamond facet
 * TODO: disallow volleys targeting of addresses behind Rampart
 */
contract CannonFacet is Cannon {


}