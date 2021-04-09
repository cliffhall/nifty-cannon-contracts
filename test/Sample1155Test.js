const { expect } = require("chai");

describe("Sample1155", function() {

    let Snifty, snifty;
    let accounts, sender, recipient, operator;

    beforeEach(async function () {

        // Get signers
        accounts = await ethers.getSigners();
        sender = accounts[0].address;
        recipient = accounts[1].address;
        operator = accounts[2].address;

        // Get the ContractFactory and Signers here.
        Snifty = await ethers.getContractFactory("Sample1155");
        snifty = await Snifty.deploy();

    });

    it("Should allow minting", async function() {

        const TOKEN_ID = 12;
        const AMOUNT = 50;

        await snifty.mintSample(sender, TOKEN_ID, AMOUNT);
        expect(await snifty.balanceOf(sender, TOKEN_ID)).to.eq(AMOUNT);

    });

    it("Should allow transfer", async function() {

        const TOKEN_ID = 12;
        const AMOUNT = 25;
        const TOTAL = AMOUNT * 2;

        await snifty.mintSample(sender, TOKEN_ID, TOTAL);
        await snifty.safeTransferFrom(sender, recipient, TOKEN_ID, AMOUNT, []);

        expect(await snifty.balanceOf(sender, TOKEN_ID)).to.eq(AMOUNT);
        expect(await snifty.balanceOf(recipient, TOKEN_ID)).to.eq(AMOUNT);

    });

    it("Should allow owner to set transfer approval to an operator", async function() {

        // Set approval for operator to manage sender's NFTs
        await snifty.setApprovalForAll(operator, true);

        // Operator should be approved for sender's NFTs
        expect (await snifty.isApprovedForAll(sender, operator)).is.true;

    });

    it("Should allow owner to remove transfer approval from an operator", async function() {

        // Set approval for operator to manage sender's NFTs
        await snifty.setApprovalForAll(operator, false);

        // Operator should be approved for sender's NFTs
        expect (await snifty.isApprovedForAll(sender, operator)).is.false;

    });

});
