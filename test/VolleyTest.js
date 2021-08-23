const { expect } = require("chai");
const Mode = require("../scripts/domain/Mode");
const Volley = require("../scripts/domain/Volley");

describe("Volley", function() {

    let accounts, sender, recipient, contract, tokenIds, amounts;

    before( async function () {

        accounts = await ethers.getSigners();
        sender = accounts[0].address;
        recipient = accounts[1].address;
        contract = accounts[2].address;
        tokenIds = [0,1,2];
        amounts = [5, 10, 7];

    });

    it("Should allow creation of valid ERC-721 Volley instance", async function() {

        const volley = new Volley(
            Mode.AIRDROP,
            sender,
            recipient,
            contract,
            tokenIds
        );

        expect(volley.modeIsValid()).is.true;
        expect(volley.senderIsValid()).is.true;
        expect(volley.recipientIsValid()).is.true;
        expect(volley.tokenContractIsValid()).is.true;
        expect(volley.tokenIdsIsValid()).is.true;
        expect(volley.amountsIsValid()).is.true;
        expect(volley.isValid()).is.true;

    });

    it("Should allow creation of valid ERC-1155 Volley instance", async function() {

        const volley = new Volley(
            Mode.AIRDROP,
            sender,
            recipient,
            contract,
            tokenIds,
            amounts
        );

        expect(volley.modeIsValid()).is.true;
        expect(volley.senderIsValid()).is.true;
        expect(volley.recipientIsValid()).is.true;
        expect(volley.tokenContractIsValid()).is.true;
        expect(volley.tokenIdsIsValid()).is.true;
        expect(volley.amountsIsValid()).is.true;
        expect(volley.isValid()).is.true;

    });

});