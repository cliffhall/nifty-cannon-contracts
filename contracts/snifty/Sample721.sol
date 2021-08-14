// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

/**
 * @title Sample ERC721 NFT for Unit Testing
 * @author Cliff Hall
 */
contract Sample721 is ERC721Enumerable {

    constructor() ERC721(TOKEN_NAME, TOKEN_SYMBOL) {}

    string public constant TOKEN_NAME = "SampleNFT";
    string public constant TOKEN_SYMBOL = "SNIFTY";

    /**
     * @dev Base URI for computing {tokenURI}.
     */
    function _baseURI() internal pure override returns (string memory) {
        return 'ipfs://QmZr5c6BW7TdL6vwGuQNfbi8gfikUynPCncSUxXoVaGKYp/';
    }

    /**
     * Mint a Sample NFT
     * @param _owner the address that will own the token
     */
    function mintSample(address _owner)
    public
    returns (uint256 tokenId) {
        tokenId = totalSupply();
        _mint(_owner, tokenId);
    }

}