const { expect } = require("chai");
const Mode = require("../domain/Mode");
const Volley = require("../domain/Volley");

describe("Cannon", function() {

    let Snifty, snifty;
    let Cannon, cannon;
    let accounts, sender, recip1, recip2, recip3, recip4, recip5, recip6, recip7, recip8;
    const tokenURIBase = "https://snifty.token/";
    const totalNFTs = 25;

    before( async function () {

        // Get accounts
        accounts = await ethers.getSigners();

        // Destructure addresses for quick use
        sender = accounts[0].address;
        recip1 = accounts[1].address;
        recip2 = accounts[2].address;
        recip3 = accounts[3].address;
        recip4 = accounts[4].address;
        recip5 = accounts[5].address;
        recip6 = accounts[6].address;
        recip7 = accounts[7].address;
        recip8 = accounts[8].address;

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

    it("Should allow sender to airdrop multiple NFTs to a single recipient with fireVolley", async function() {

        // Construct the Volley and ensure it is valid
        const volley = new Volley(
            Mode.AIRDROP,
            sender,
            recip1,
            snifty.address,
            [0,1]
        );
        expect(volley.isValid()).is.true;

        // Execute the airdrop send
        await expect(cannon.fireVolley(volley))
            .to.emit(snifty, 'Transfer')
            .withArgs(sender, recip1, 0);

        // Ensure recipient 1 received all their tokens
        for (let i=0; i<volley.tokenIds.length; i++){
            expect(await snifty.ownerOf(volley.tokenIds[i])).equal(recip1);
        }

    });

    it("Should allow sender to airdrop multiple NFTs to multiple recipients with fireVolleys", async function() {

        // Construct the Volley and ensure it is valid
        const volley1 = new Volley(
            Mode.AIRDROP,
            sender,
            recip2,
            snifty.address,
            [2,3]
        );
        expect(volley1.isValid()).is.true;

        // Construct the Volley and ensure it is valid
        const volley2 = new Volley(
            Mode.AIRDROP,
            sender,
            recip3,
            snifty.address,
            [4,5]
        );
        expect(volley2.isValid()).is.true;

        const volleys = [volley1, volley2];

        // Execute the airdrop send
        await cannon.fireVolleys(volleys);

        // Ensure recipient 2 received all their tokens
        for (let i=0; i<volley1.tokenIds.length; i++){
            expect(await snifty.ownerOf(volley1.tokenIds[i])).equal(recip2);
        }

        // Ensure recipient 3 received all their tokens
        for (let i=0; i<volley2.tokenIds.length; i++){
            expect(await snifty.ownerOf(volley2.tokenIds[i])).equal(recip3);
        }

    });

    it("Should allow recipient to pickup a single will-call volley with receiveVolley", async function() {

        // Construct the Volley
        const volley = new Volley(
            Mode.WILLCALL,
            sender,
            recip3,
            snifty.address,
            [6,7]
        );

        // Validate Volley
        expect(volley.isValid()).is.true;

        // Be sure there are no awaiting volleys for recipient
        expect(await cannon.connect(accounts[3]).myWillCallCount()).to.equal(0);

        // Execute the will-call send
        await cannon.fireVolley(volley);

        // Be sure there is one awaiting volley for recipient
        expect(await cannon.connect(accounts[3]).myWillCallCount()).to.equal(1);

        // Pickup recipient's volley on will-call
        await cannon.connect(accounts[3]).receiveVolley(0);

        // Ensure recipient has all their tokens on will-call
        for (let i=0; i<volley.tokenIds.length; i++){
            expect(await snifty.ownerOf(volley.tokenIds[i])).equal(recip3);
        }

    });

    it("Should allow recipient to pickup multiple will-call volleys with receiveAllVolleys", async function() {

        // Construct the first Volley
        const volley1 = new Volley(
            Mode.WILLCALL,
            sender,
            recip4,
            snifty.address,
            [8,9]
        );

        // Construct the second Volley
        const volley2 = new Volley(
            Mode.WILLCALL,
            sender,
            recip4,
            snifty.address,
            [10,11]
        );

        // Validate Volleys
        expect(volley1.isValid()).is.true;
        expect(volley2.isValid()).is.true;

        // Be sure there are no awaiting volleys
        expect(await cannon.connect(accounts[4]).myWillCallCount()).to.equal(0);

        // Execute the will-call send
        const volleys = [volley1, volley2];
        await cannon.fireVolleys(volleys);

        // Be sure there are two awaiting volleys
        expect(await cannon.connect(accounts[4]).myWillCallCount()).to.equal(2);

        // Pickup Recipient 2's volley on will-call
        await cannon.connect(accounts[4]).receiveAllVolleys();

        // Ensure recipient 2 received all their tokens from first volley
        for (let i=0; i<volley1.tokenIds.length; i++){
            expect(await snifty.ownerOf(volley1.tokenIds[i])).equal(recip4);
        }

        // Ensure recipient 2 received all their tokens from second volley
        for (let i=0; i<volley2.tokenIds.length; i++){
            expect(await snifty.ownerOf(volley2.tokenIds[i])).equal(recip4);
        }

    });

    it("Should allow anyone to check the count of will-call volleys awaiting them", async function() {

        // Construct the Volley
        const volley = new Volley(
            Mode.WILLCALL,
            sender,
            recip5,
            snifty.address,
            [12, 13, 14]
        );

        // Validate Volley
        expect(volley.isValid()).is.true;

        // When no volleys have been sent to the recipient, the count should be 0
        expect(await cannon.connect(accounts[5]).myWillCallCount()).to.equal(0);

        // Execute a will-call send
        await cannon.fireVolley(volley);

        // Be sure there is one awaiting volley for recipient
        expect(await cannon.connect(accounts[5]).myWillCallCount()).to.equal(1);

    });

    it("Should emit a VolleyTransferred event upon successful airdrop", async function() {

        // Construct the Volley
        const volley = new Volley(
            Mode.AIRDROP,
            sender,
            recip6,
            snifty.address,
            [15, 16, 17]
        );

        // Validate Volley
        expect(volley.isValid()).is.true;

        // Execute a will-call send
        await expect(cannon.fireVolley(volley))
            .to
            .emit(cannon,"VolleyTransferred")
            .withArgs(sender, recip6, snifty.address, volley.tokenIds);

    });

    it("Should emit a VolleyStored event upon successful storage of will-call volley", async function() {

        // Construct the Volley
        const volley = new Volley(
            Mode.WILLCALL,
            sender,
            recip7,
            snifty.address,
            [18, 19, 20]
        );

        // Validate Volley
        expect(volley.isValid()).is.true;

        // Execute a will-call send
        await expect(cannon.fireVolley(volley))
            .to
            .emit(cannon,"VolleyStored")
            .withArgs(sender, recip7, snifty.address, volley.tokenIds);

    });

    it("Should emit a VolleyTransferred event upon successful will-call pickup", async function() {

        // Construct the Volley
        const volley = new Volley(
            Mode.WILLCALL,
            sender,
            recip8,
            snifty.address,
            [21, 22, 23]
        );

        // Validate Volley
        expect(volley.isValid()).is.true;

        // Execute a will-call send
        await expect(cannon.fireVolley(volley))
            .to
            .emit(cannon,"VolleyStored")
            .withArgs(sender, recip8, snifty.address, volley.tokenIds);

        // Pickup recipient's volley on will-call
        await expect(cannon.connect(accounts[8]).receiveVolley(0))
            .to
            .emit(cannon, "VolleyTransferred")
            .withArgs(sender, recip8, snifty.address, volley.tokenIds);


    });

});