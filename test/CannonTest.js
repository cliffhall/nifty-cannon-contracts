const { expect } = require("chai");
const Mode = require("../domain/Mode");
const Volley = require("../domain/Volley");

describe("Cannon", function() {

    let Snifty, snifty;
    let Cannon, cannon;
    let accounts, sender, recip1, recip2, recip3;
    const tokenURIBase = "https://snifty.token/";
    const totalNFTs = 12;

    before( async function () {

        // Get accounts
        accounts = await ethers.getSigners();

        sender = accounts[0].address;
        recip1 = accounts[1].address;
        recip2 = accounts[2].address;
        recip3 = accounts[3].address;

        // Deploy the contracts
        Snifty = await ethers.getContractFactory("SampleNFT");
        snifty = await Snifty.deploy();

        Cannon = await ethers.getContractFactory("Cannon");
        cannon = await Cannon.deploy();

        // Pre-mint some NFTs to transfer
        for (let i=0; i<totalNFTs; i++) {
            await snifty.mintSample(sender, tokenURIBase);
        }

        // Set approval for Cannon to manage sender's NFTs
        await snifty.setApprovalForAll(cannon.address, true);

    });

    it("Should allow sender to airdrop multiple tokens to a single recipient with fireToOne", async function() {

        // Construct the Volley and ensure it is valid
        const volley = new Volley(
            Mode.AirDrop,
            sender,
            recip1,
            snifty.address,
            [0,1]
        );
        expect(volley.isValid()).is.true;

        // Execute the airdrop send
        await expect(cannon.fireToOne(volley))
            .to.emit(snifty, 'Transfer')
            .withArgs(sender, recip1, 0);

        // Ensure recipient 1 received all their tokens
        for (let i=0; i<volley.tokenIds.length; i++){
            expect(await snifty.ownerOf(volley.tokenIds[i])).equal(recip1);
        }

    });

    it("Should allow sender to airdrop multiple tokens to multiple recipients with fireToMany", async function() {

        // Construct the Volley and ensure it is valid
        const volley1 = new Volley(
            Mode.AirDrop,
            sender,
            recip2,
            snifty.address,
            [2,3]
        );
        expect(volley1.isValid()).is.true;

        // Construct the Volley and ensure it is valid
        const volley2 = new Volley(
            Mode.AirDrop,
            sender,
            recip3,
            snifty.address,
            [4,5]
        );
        expect(volley2.isValid()).is.true;

        const fusillade = [volley1, volley2];

        // Execute the airdrop send
        await cannon.fireToMany(fusillade);

        // Ensure recipient 2 received all their tokens
        for (let i=0; i<volley1.tokenIds.length; i++){
            expect(await snifty.ownerOf(volley1.tokenIds[i])).equal(recip2);
        }

        // Ensure recipient 3 received all their tokens
        for (let i=0; i<volley2.tokenIds.length; i++){
            expect(await snifty.ownerOf(volley2.tokenIds[i])).equal(recip3);
        }

    });

    it("Should allow willcall recipient to pickup multiple tokens with receiveVolley", async function() {

        // Construct the Volley and ensure it is valid
        const volley = new Volley(
            Mode.WillCall,
            sender,
            recip1,
            snifty.address,
            [6,7]
        );
        expect(volley.isValid()).is.true;

        // Execute the will call send
        //await expect(cannon.fireToOne(volley))
        //    .not.to.emit(snifty, 'Transfer');
        await cannon.fireToOne(volley);

        await cannon.connect(accounts[1]).receiveVolley(0);

        // Ensure recipient 1 has all their tokens on willcall
        for (let i=0; i<volley.tokenIds.length; i++){
            expect(await snifty.ownerOf(volley.tokenIds[i])).equal(recip1);
        }

    });

    it("Should allow willcall recipient to pickup multiple tokens with receiveAllVolleys", async function() {

        // Construct the first Volley and ensure it is valid
        const volley1 = new Volley(
            Mode.WillCall,
            sender,
            recip2,
            snifty.address,
            [8,9]
        );
        expect(volley1.isValid()).is.true;

        // Construct the second Volley and ensure it is valid
        const volley2 = new Volley(
            Mode.WillCall,
            sender,
            recip2,
            snifty.address,
            [10,11]
        );
        expect(volley2.isValid()).is.true;

        const volleys = [volley1, volley2];

        // Execute the will call send
        await cannon.fireToMany(volleys);

        // Pickup Recipient 2's volley
        await cannon.connect(accounts[2]).receiveAllVolleys();
        //await cannon.connect(accounts[2]).receiveVolley(0);
        //await cannon.connect(accounts[2]).receiveVolley(0);

        // Ensure recipient 2 received all their tokens from first volley
        for (let i=0; i<volley1.tokenIds.length; i++){
            expect(await snifty.ownerOf(volley1.tokenIds[i])).equal(recip2);
        }

        // Ensure recipient 2 received all their tokens from second volley
        for (let i=0; i<volley2.tokenIds.length; i++){
            expect(await snifty.ownerOf(volley2.tokenIds[i])).equal(recip2);
        }

    });


});