// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../cannon/CannonClaim.sol";
import "../cannon/CannonSend.sol";
import "../cannon/CannonView.sol";

/**
 * @title Nifty Cannon
 * @author Cliff Hall
 * @notice Allows direct or deferred transfer of NFTs from one sender to one or more recipients.
 */
contract CannonFacet is CannonClaim, CannonSend, CannonView {

}