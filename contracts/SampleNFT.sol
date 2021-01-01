// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;

import "./CannonBase.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @title Sample NFT for Unit Testing
 * @author Cliff Hall
 */
contract SampleNFT is ERC721, CannonBase {

    constructor() ERC721(TOKEN_NAME, TOKEN_SYMBOL) {}

    string public constant TOKEN_NAME = "SampleNFT";
    string public constant TOKEN_SYMBOL = "SNIFTY";
    
    /**
     * Mint a Sample NFT
     * @param _owner the address that will own the token
     * @param _tokenURIBase the base url to which tokenId will be added.
     */
    function mintSample(address _owner, string memory _tokenURIBase)
    public
    returns (uint256 tokenId, string memory tokenURI) {

        tokenId = totalSupply();
        tokenURI = strConcat(_tokenURIBase, uintToStr(tokenId));
        _mint(_owner, tokenId);
        _setTokenURI(tokenId, tokenURI);

        return (
            tokenId,
            tokenURI
        );
    }

}