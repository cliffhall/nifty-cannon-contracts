const { expect } = require("chai");
const Ticket = require("../scripts/domain/Ticket");

describe("Ticket", function() {

    let accounts, ticketId, sender, contract, tokenIds;

    before( async function () {

        accounts = await ethers.getSigners();
        ticketId = 12;
        sender = accounts[0].address;
        contract = accounts[2].address;
        tokenIds = [0,1,2];

    });

    it("Should allow creation of valid Ticket instance", async function() {

        const ticket = new Ticket(
            ticketId,
            sender,
            contract,
            tokenIds
        );

        expect(ticket.ticketIdIsValid()).is.true;
        expect(ticket.senderIsValid()).is.true;
        expect(ticket.tokenContractIsValid()).is.true;
        expect(ticket.tokenIdsIsValid()).is.true;
        expect(ticket.isValid()).is.true;

    });

});