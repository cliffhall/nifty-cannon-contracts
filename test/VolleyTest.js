const { expect } = require("chai");
const Mode = require("../domain/Mode");
const Volley = require("../domain/Volley");

describe("Volley", function() {

    let accounts, sender, recipient, contract, tokenIds;

    before( async function () {

        accounts = await ethers.getSigners();
        sender = accounts[0].address;
        recipient = accounts[1].address;
        contract = accounts[2].address;
        tokenIds = [0,1,2];

    });

    it("Should allow creation of valid Volley instance", async function() {

        const volley = new Volley(
            Mode.AirDrop,
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
        expect(volley.isValid()).is.true;

    });

});