const { expect } = require("chai");

describe("SampleNFT", function() {


    let Snifty, snifty;
    let accounts, sender, operator;
    const tokenURIBase = "https://ipfs.io/ipfs/QmZr5c6BW7TdL6vwGuQNfbi8gfikUynPCncSUxXoVaGKYp/";

    before(async function () {

        // Get signers
        accounts = await ethers.getSigners();
        sender = accounts[0].address;
        operator = accounts[1].address;

        // Get the ContractFactory and Signers here.
        Snifty = await ethers.getContractFactory("SampleNFT");
        snifty = await Snifty.deploy();

    });

    it("Should allow minting", async function() {

        const supply = await snifty.totalSupply();
        await snifty.mintSample(sender);
        expect(await snifty.totalSupply()).to.eq(supply + 1);
        expect(await snifty.ownerOf(0)).to.eq(sender);
        expect(await snifty.tokenURI(0)).to.eq(`${tokenURIBase}${supply}`);
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
