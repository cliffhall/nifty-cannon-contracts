const { expect } = require("chai");

describe("SampleNFT", function() {


    let Snifty, snifty;
    let accounts, sender;
    const tokenURIBase = "https://snifty.token/";

    before(async function () {

        // Get signers
        accounts = await ethers.getSigners();
        sender = accounts[0].address;

        // Get the ContractFactory and Signers here.
        Snifty = await ethers.getContractFactory("SampleNFT");
        snifty = await Snifty.deploy();

    });

    it("Should allow minting", async function() {

        const supply = await snifty.totalSupply();
        await snifty.mintSample(sender, tokenURIBase);
        expect(await snifty.totalSupply()).to.eq(supply + 1);
        expect(await snifty.ownerOf(0)).to.eq(sender);
        expect(await snifty.tokenURI(0)).to.eq(`${tokenURIBase}${supply}`);
    });

});
