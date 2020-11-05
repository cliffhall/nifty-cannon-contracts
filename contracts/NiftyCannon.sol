pragma solidity 0.7.4;

/**
 * @title Nifty Cannon
 * @author Cliff Hall
 */
contract NiftyCannon {

    enum TokenType {
        ERC721,
        ERC1155
    }

    struct Volley {
        TokenType tokenType;
        address tokenContract;
        address recipient;
        address sender;
        uint256[] tokenIds;
    }

    struct Fusillade {
        Volley[] volleys;
    }

}