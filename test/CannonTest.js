const { expect } = require("chai");
const hre = require("hardhat");
const ethers = hre.ethers;
const Mode = require("../scripts/domain/Mode");
const Volley = require("../scripts/domain/Volley");
const Ticket = require("../scripts/domain/Ticket");
const {deployProxiedCannon} = require("../scripts/util/deploy-proxied-cannon");
const {deployStandaloneCannon} = require("../scripts/util/deploy-standalone-cannon");

describe("NiftyCannon", async function() {

    let Snifty, Multi;
    let snifty, multi, cannon, proxy;
    let accounts, deployer, sender, recipient, recip1, recip2, anon;
    let volley, volley1, volley2, volleys, ticket, ticketId, nextTicketId, amount;
    const TICKET_URI = "ipfs://QmdEkQjAXJAjPZtJFzJZJPxnBtu2FsoDGfH7EofA5sc6vT";
    const multiTokenId1 = 0;
    const multiTokenId2 = 1;
    const niftiesToMint = 50;

    beforeEach( async function () {

        // Get accounts
        accounts = await ethers.getSigners();

        // Addresses
        deployer = accounts[0];
        sender = accounts[1];
        recipient = accounts[2];
        recip1 = accounts[3];
        recip2 = accounts[4];
        anon = accounts[5];

        // Deploy the Sample721 contract
        Snifty = await ethers.getContractFactory("Sample721");
        snifty = await Snifty.deploy();
        await snifty.deployed();

        // Deploy the Sample1155 contract
        Multi = await ethers.getContractFactory("Sample1155");
        multi = await Multi.deploy();
        await multi.deployed();

        // Pre-mint some NFTs to transfer
        for (let i=0; i<niftiesToMint; i++) {
            await snifty.mintSample(sender.address);
        }

        // Pre-mint some ERC-1155 NFTs to transfer
        await multi.mintSample(sender.address, multiTokenId1, niftiesToMint);
        await multi.mintSample(sender.address, multiTokenId2, niftiesToMint);

        // Set amount to transfer
        amount = 10;
    });

    describe("As a standalone contract, invoked directly", function() {

        beforeEach( async function () {

            // Deploy Cannon
            cannon = await deployStandaloneCannon();

            // Set approval for Cannon to manage sender's NFTs
            await snifty.connect(sender).setApprovalForAll(cannon.address, true);
            await multi.connect(sender).setApprovalForAll(cannon.address, true);

        });

        testCannon();

    })

    describe("As a logic contract, invoked via proxy", function() {

        beforeEach( async function () {

            // Deploy Proxied Cannon
            //
            // N.B. first arg returned is actually the proxy, but for testing,
            // we want 'cannon' to be the proxy. The cannon contract address
            // and proxy args can be ignored here
            [proxy] = await deployProxiedCannon(deployer.address);

            // Cast NiftyCannonProxy to NiftyCannon
            cannon = await ethers.getContractAt('NiftyCannon', proxy.address);

            // Set approval for Cannon to manage sender's NFTs
            await snifty.connect(sender).setApprovalForAll(cannon.address, true);
            await multi.connect(sender).setApprovalForAll(cannon.address, true);

        });

        testCannon();

    })

    // Reusable tests
    function testCannon() {

        context("Events", async function() {

            it("Should emit a VolleyTransferred event upon successful airdrop", async function () {

                // Construct the Volley
                volley = new Volley(
                    Mode.AIRDROP,
                    sender.address,
                    recipient.address,
                    snifty.address,
                    [15, 16, 17]
                );

                // Validate Volley
                expect(volley.isValid()).is.true;

                // Execute a will-call send
                await expect(cannon.connect(sender).fireVolley(volley))
                    .to
                    .emit(cannon, "VolleyTransferred")
                    .withArgs(sender.address, recipient.address, snifty.address, volley.tokenIds, volley.amounts);

            });

            it("Should emit a VolleyStored event upon successful storage of will-call volley", async function () {

                // Construct the Volley
                volley = new Volley(
                    Mode.WILLCALL,
                    sender.address,
                    recipient.address,
                    snifty.address,
                    [18, 19, 20]
                );

                // Validate Volley
                expect(volley.isValid()).is.true;

                // Execute a will-call send
                await expect(cannon.connect(sender).fireVolley(volley))
                    .to
                    .emit(cannon, "VolleyStored")
                    .withArgs(sender.address, recipient.address, snifty.address, volley.tokenIds, volley.amounts);

            });

            it("Should emit a VolleyTransferred event upon successful will-call pickup", async function () {

                // Construct the Volley
                volley = new Volley(
                    Mode.WILLCALL,
                    sender.address,
                    recipient.address,
                    snifty.address,
                    [21, 22, 23]
                );

                // Validate Volley
                expect(volley.isValid()).is.true;

                // Execute a will-call send
                await expect(cannon.connect(sender).fireVolley(volley))
                    .to
                    .emit(cannon, "VolleyStored")
                    .withArgs(sender.address, recipient.address, snifty.address, volley.tokenIds, volley.amounts);

                // Pickup recipient's will-call volley
                await expect(cannon.connect(recipient).claimVolley(0))
                    .to
                    .emit(cannon, "VolleyTransferred")
                    .withArgs(sender.address, recipient.address, snifty.address, volley.tokenIds, volley.amounts);

            });

            it("Should emit a VolleyTicketed event & recipient owns ticket upon issue of transferable ticket", async function () {

                // Construct the Volley
                volley = new Volley(
                    Mode.TICKET,
                    sender.address,
                    recipient.address,
                    snifty.address,
                    [21, 22, 23]
                );

                // Validate Volley
                expect(volley.isValid()).is.true;

                // Get next ticket id
                ticketId = await cannon.getNextTicketId();

                // Execute a ticketed send
                await expect(cannon.connect(sender).fireVolley(volley))
                    .to
                    .emit(cannon, "VolleyTicketed")
                    .withArgs(sender.address, recipient.address, ticketId, snifty.address, volley.tokenIds, volley.amounts);

                // Recipient should own the the NFT for the ticket
                expect(await cannon.ownerOf(ticketId)).equal(recipient.address);

            });

        });

        context("Airdrop", async function() {

            context("fireVolley()", async function() {

                it("Should allow sender to airdrop multiple 721 NFTs to a single recipient with fireVolley", async function() {

                    // Construct the Volley and ensure it is valid
                    volley = new Volley(
                        Mode.AIRDROP,
                        sender.address,
                        recipient.address,
                        snifty.address,
                        [0,1]
                    );
                    expect(volley.isValid()).is.true;

                    // Execute the airdrop send
                    await expect(cannon.connect(sender).fireVolley(volley))
                        .to.emit(snifty, 'Transfer')
                        .withArgs(sender.address, recipient.address, 0);

                    // Ensure recipient received all their tokens
                    for (let i=0; i<volley.tokenIds.length; i++){
                        expect(await snifty.ownerOf(volley.tokenIds[i])).equal(recipient.address);
                    }

                });

                it("Should allow sender to airdrop an amount of an 1155 NFT to a single recipient with fireVolley", async function() {

                    // Set amount to transfer
                    amount = 10;

                    // Construct the Volley and ensure it is valid
                    volley = new Volley(
                        Mode.AIRDROP,
                        sender.address,
                        recipient.address,
                        multi.address,
                        [multiTokenId1],
                        [amount]
                    );
                    expect(volley.isValid()).is.true;

                    // Execute the airdrop send
                    await expect(cannon.connect(sender).fireVolley(volley))
                        .to.emit(multi, 'TransferSingle')
                        .withArgs(cannon.address, sender.address, recipient.address, multiTokenId1, amount);

                    // Ensure recipient received all their tokens
                    expect(await multi.balanceOf(recipient.address, multiTokenId1)).equal(amount);

                });

            });

            context("fireVolleys()", async function() {

                it("Should allow sender to airdrop multiple 721 NFTs to multiple recipients", async function() {

                    // Construct the Volley and ensure it is valid
                    volley1 = new Volley(
                        Mode.AIRDROP,
                        sender.address,
                        recip1.address,
                        snifty.address,
                        [2,3]
                    );
                    expect(volley1.isValid()).is.true;

                    // Construct the Volley and ensure it is valid
                    volley2 = new Volley(
                        Mode.AIRDROP,
                        sender.address,
                        recip2.address,
                        snifty.address,
                        [4,5]
                    );
                    expect(volley2.isValid()).is.true;

                    volleys = [volley1, volley2];

                    // Execute the airdrop send
                    await cannon.connect(sender).fireVolleys(volleys);

                    // Ensure recipient 2 received all their tokens
                    for (let i=0; i<volley1.tokenIds.length; i++){
                        expect(await snifty.ownerOf(volley1.tokenIds[i])).equal(recip1.address);
                    }

                    // Ensure recipient 3 received all their tokens
                    for (let i=0; i<volley2.tokenIds.length; i++){
                        expect(await snifty.ownerOf(volley2.tokenIds[i])).equal(recip2.address);
                    }

                });

                it("Should allow sender to airdrop amounts of multiple 1155 NFTs to multiple recipients", async function() {

                    // Construct the Volley and ensure it is valid
                    volley1 = new Volley(
                        Mode.AIRDROP,
                        sender.address,
                        recip1.address,
                        multi.address,
                        [multiTokenId1],
                        [amount]
                    );
                    expect(volley1.isValid()).is.true;

                    // Construct the Volley and ensure it is valid
                    volley2 = new Volley(
                        Mode.AIRDROP,
                        sender.address,
                        recip2.address,
                        multi.address,
                        [multiTokenId1],
                        [amount]
                    );
                    expect(volley2.isValid()).is.true;

                    volleys = [volley1, volley2];

                    // Execute the airdrop send
                    await cannon.connect(sender).fireVolleys(volleys);

                    // Make sure they arrived
                    expect(await multi.balanceOf(recip1.address, multiTokenId1)).equal(amount);
                    expect(await multi.balanceOf(recip2.address, multiTokenId1)).equal(amount);

                });

                it("Should allow sender to airdrop amounts of multiple 1155 NFTs to a single recipient as a batch", async function() {

                    // Construct the Volley and ensure it is valid
                    volley = new Volley(
                        Mode.AIRDROP,
                        sender.address,
                        recip1.address,
                        multi.address,
                        [multiTokenId1, multiTokenId2],
                        [amount, amount]
                    );
                    expect(volley.isValid()).is.true;

                    // Execute the airdrop send
                    await cannon.connect(sender).fireVolley(volley);

                    // Make sure they arrived
                    expect(await multi.balanceOf(recip1.address, multiTokenId1)).equal(amount);
                    expect(await multi.balanceOf(recip1.address, multiTokenId2)).equal(amount);

                });

            });

        });

        context("Will-call", async function() {

            context("myWillCallCount()", async function() {

                it("Should allow anyone to check the count of will-call volleys awaiting them", async function () {

                    // Construct the Volley
                    volley = new Volley(
                        Mode.WILLCALL,
                        sender.address,
                        recipient.address,
                        snifty.address,
                        [12, 13, 14]
                    );

                    // Validate Volley
                    expect(volley.isValid()).is.true;

                    // When no volleys have been sent to the recipient, the count should be 0
                    expect(await cannon.connect(recipient).myWillCallCount()).to.equal(0);

                    // Execute a will-call send
                    await cannon.connect(sender).fireVolley(volley);

                    // Be sure there is one waiting volley for recipient
                    expect(await cannon.connect(recipient).myWillCallCount()).to.equal(1);

                });

            });

            context("myVolleys()", async function() {

                it("Should return a list of waiting will-call volleys", async function () {

                    // Construct the Volley
                    volley = new Volley(
                        Mode.WILLCALL,
                        sender.address,
                        recipient.address,
                        snifty.address,
                        [12, 13, 14]
                    );

                    // Validate Volley
                    expect(volley.isValid()).is.true;

                    // Execute a will-call send
                    await cannon.connect(sender).fireVolley(volley);

                    // Fetch the volleys
                    const result = await cannon.connect(recipient).myVolleys();
                    expect(result.length).to.equal(1);
                    expect(result[0].sender).to.equal(volley.sender);
                    expect(result[0].recipient).to.equal(volley.recipient);
                    expect(result[0].tokenContract).to.equal(volley.tokenContract);
                    expect(result[0].tokenIds.length).to.equal(volley.tokenIds.length);

                });

                it("Should return empty array if no volleys await", async function () {

                    // Fetch the volleys
                    const result = await cannon.connect(recipient).myVolleys();
                    expect(result.length).to.equal(0);

                });

            });

            context("fireVolley()", async function() {

                it("Should allow sender to leave multiple 721 NFTs on will-call for a single recipient with fireVolley", async function() {

                    // Construct the Volley and ensure it is valid
                    volley = new Volley(
                        Mode.WILLCALL,
                        sender.address,
                        recipient.address,
                        snifty.address,
                        [0,1]
                    );
                    expect(volley.isValid()).is.true;

                    // Execute a will-call send
                    await cannon.connect(sender).fireVolley(volley);

                    // Be sure there is one waiting volley for recipient
                    expect(await cannon.connect(recipient).myWillCallCount()).to.equal(1);

                });

                it("Should allow sender to leave amounts of 1155 NFTs on will-call for a single recipient with fireVolley", async function() {

                    // Set amount to transfer
                    amount = 10;

                    // Construct the Volley and ensure it is valid
                    volley = new Volley(
                        Mode.WILLCALL,
                        sender.address,
                        recipient.address,
                        multi.address,
                        [multiTokenId1],
                        [amount]
                    );
                    expect(volley.isValid()).is.true;

                    // Execute the airdrop send
                    await cannon.connect(sender).fireVolley(volley);

                    // Be sure there is one waiting volley for recipient
                    expect(await cannon.connect(recipient).myWillCallCount()).to.equal(1);

                });

            });

            context("fireVolleys()", async function() {

                it("Should allow sender to leave multiple 721 NFTs on will-call for multiple recipients", async function() {

                    // Construct the Volley and ensure it is valid
                    volley1 = new Volley(
                        Mode.WILLCALL,
                        sender.address,
                        recip1.address,
                        snifty.address,
                        [2,3]
                    );
                    expect(volley1.isValid()).is.true;

                    // Construct the Volley and ensure it is valid
                    volley2 = new Volley(
                        Mode.WILLCALL,
                        sender.address,
                        recip2.address,
                        snifty.address,
                        [4,5]
                    );
                    expect(volley2.isValid()).is.true;

                    volleys = [volley1, volley2];

                    // Execute the will-call send
                    await cannon.connect(sender).fireVolleys(volleys);

                    // Be sure there is one waiting volley for recipient 1
                    expect(await cannon.connect(recip1).myWillCallCount()).to.equal(1);

                    // Be sure there is one waiting volley for recipient 2
                    expect(await cannon.connect(recip2).myWillCallCount()).to.equal(1);

                });

                it("Should allow sender to leave amounts 1155 NFTs on will-call for multiple recipients", async function() {

                    // Construct the Volley and ensure it is valid
                    volley1 = new Volley(
                        Mode.WILLCALL,
                        sender.address,
                        recip1.address,
                        multi.address,
                        [multiTokenId1],
                        [amount]
                    );
                    expect(volley1.isValid()).is.true;

                    // Construct the Volley and ensure it is valid
                    volley2 = new Volley(
                        Mode.WILLCALL,
                        sender.address,
                        recip2.address,
                        multi.address,
                        [multiTokenId1],
                        [amount]
                    );
                    expect(volley2.isValid()).is.true;

                    volleys = [volley1, volley2];

                    // Execute the will-call send
                    await cannon.connect(sender).fireVolleys(volleys);

                    // Be sure there is one waiting volley for recipient 1
                    expect(await cannon.connect(recip1).myWillCallCount()).to.equal(1);

                    // Be sure there is one waiting volley for recipient 2
                    expect(await cannon.connect(recip2).myWillCallCount()).to.equal(1);

                });

            });

            context("claimVolley()", async function() {

                it("Should allow recipient to pickup a single waiting will-call volley", async function() {

                    // Construct the Volley
                    volley = new Volley(
                        Mode.WILLCALL,
                        sender.address,
                        recipient.address,
                        snifty.address,
                        [6,7]
                    );

                    // Validate Volley
                    expect(volley.isValid()).is.true;

                    // Execute the will-call send
                    await cannon.connect(sender).fireVolley(volley);

                    // Pickup recipient's volley on will-call
                    await cannon.connect(recipient).claimVolley(0);

                    // Ensure recipient has all their tokens on will-call
                    for (let i=0; i<volley.tokenIds.length; i++){
                        expect(await snifty.ownerOf(volley.tokenIds[i])).equal(recipient.address);
                    }

                });

                it("Should allow recipient to pickup a single will-call volley with multiple waiting", async function () {

                    // Construct the first Volley
                    volley1 = new Volley(
                        Mode.WILLCALL,
                        sender.address,
                        recipient.address,
                        snifty.address,
                        [8, 9]
                    );

                    // Construct the second Volley
                    volley2 = new Volley(
                        Mode.WILLCALL,
                        sender.address,
                        recipient.address,
                        snifty.address,
                        [10, 11]
                    );

                    // Validate Volleys
                    expect(volley1.isValid()).is.true;
                    expect(volley2.isValid()).is.true;

                    // Execute the will-call send
                    volleys = [volley1, volley2];
                    await cannon.connect(sender).fireVolleys(volleys);

                    // Pickup Recipient's second volley on will-call
                    await cannon.connect(recipient).claimVolley(1);

                    // Ensure recipient received all their tokens from second volley
                    for (let i = 0; i < volley2.tokenIds.length; i++) {
                        expect(await snifty.ownerOf(volley2.tokenIds[i])).equal(recipient.address);
                    }

                    // Be sure there is still one waiting volley for recipient
                    expect(await cannon.connect(recipient).myWillCallCount()).to.equal(1);

                    // Pickup Recipient's first volley on will-call
                    await cannon.connect(recipient).claimVolley(0);

                    // Ensure recipient received all their tokens from first volley
                    for (let i = 0; i < volley1.tokenIds.length; i++) {
                        expect(await snifty.ownerOf(volley1.tokenIds[i])).equal(recipient.address);
                    }

                });


            });

            context("claimAllVolleys()", async function() {

                it("Should allow recipient to pickup multiple will-call volleys", async function () {

                    // Construct the first Volley
                    volley1 = new Volley(
                        Mode.WILLCALL,
                        sender.address,
                        recipient.address,
                        snifty.address,
                        [8, 9]
                    );

                    // Construct the second Volley
                    volley2 = new Volley(
                        Mode.WILLCALL,
                        sender.address,
                        recipient.address,
                        snifty.address,
                        [10, 11]
                    );

                    // Validate Volleys
                    expect(volley1.isValid()).is.true;
                    expect(volley2.isValid()).is.true;

                    // Execute the will-call send
                    volleys = [volley1, volley2];
                    await cannon.connect(sender).fireVolleys(volleys);

                    // Pickup Recipient's volley on will-call
                    await cannon.connect(recipient).claimAllVolleys();

                    // Ensure recipient received all their tokens from first volley
                    for (let i = 0; i < volley1.tokenIds.length; i++) {
                        expect(await snifty.ownerOf(volley1.tokenIds[i])).equal(recipient.address);
                    }

                    // Ensure recipient received all their tokens from second volley
                    for (let i = 0; i < volley2.tokenIds.length; i++) {
                        expect(await snifty.ownerOf(volley2.tokenIds[i])).equal(recipient.address);
                    }

                });

            });

        });

        context("Tickets", async function() {

            context("getNextTicketId()", async function() {

                it("Should return the id that will be assigned to the transferable ticket", async function () {

                    // Construct the Volley
                    volley = new Volley(
                        Mode.TICKET,
                        sender.address,
                        recipient.address,
                        snifty.address,
                        [24, 25, 26]
                    );

                    // Validate Volley
                    expect(volley.isValid()).is.true;

                    // Get next ticket id
                    ticketId = await cannon.connect(anon).getNextTicketId();

                    // Execute a ticketed send, check the id matches the id assigned
                    await expect(cannon.connect(sender).fireVolley(volley))
                        .to
                        .emit(cannon, "VolleyTicketed")
                        .withArgs(sender.address, recipient.address, ticketId, snifty.address, volley.tokenIds, volley.amounts);

                });

                it("Should return incremented ticketId upon successful issue of transferable ticket", async function () {

                    // Construct the Volley
                    volley = new Volley(
                        Mode.TICKET,
                        sender.address,
                        recipient.address,
                        snifty.address,
                        [24, 25, 26]
                    );

                    // Validate Volley
                    expect(volley.isValid()).is.true;

                    // Get next ticket id
                    ticketId = await cannon.connect(anon).getNextTicketId();

                    // Execute a ticketed send
                    await cannon.connect(sender).fireVolley(volley);

                    // Get next ticket id
                    nextTicketId = await cannon.connect(anon).getNextTicketId();

                    // Make sure next ticket id was incremented
                    expect(nextTicketId.eq(ticketId.add("1"))).to.be.true;

                });

            });

            context("tokenURI()", async function() {

                it("Should return the appropriate URI", async function () {

                    // Construct the second Volley
                    volley = new Volley(
                        Mode.TICKET,
                        sender.address,
                        recipient.address,
                        snifty.address,
                        [43, 44, 45]
                    );

                    // Validate Volleys
                    expect(volley.isValid()).is.true;

                    // Get next ticket id
                    ticketId = await cannon.connect(anon).getNextTicketId();

                    // Execute the will-call send
                    await cannon.connect(sender).fireVolley(volley);

                    // Check token URI
                    expect(await cannon.tokenURI(ticketId)).equal(TICKET_URI);

                });

            });

            context("myTickets()", async function() {

                it("Should allow recipient to fetch a list of their waiting transferable tickets", async function () {

                    // Construct the Volley
                    volley = new Volley(
                        Mode.TICKET,
                        sender.address,
                        recipient.address,
                        snifty.address,
                        [24, 25, 26]
                    );

                    // Get next ticket id
                    ticketId = await cannon.connect(anon).getNextTicketId();

                    // Execute a ticketed send
                    await cannon.connect(sender).fireVolley(volley);

                    // Fetch the tickets
                    const result = await cannon.connect(recipient).myTickets();
                    expect(result.length).to.equal(1);

                    // Construct the Ticket
                    ticket = new Ticket(
                        Number(ticketId.toString()),
                        result[0].sender,
                        result[0].tokenContract,
                        result[0].tokenIds.map(id => Number(id.toString()))
                    );

                    // Validate Ticket
                    expect(ticket.isValid()).is.true;

                    expect(ticket.sender).to.equal(volley.sender);
                    expect(ticket.tokenContract).to.equal(volley.tokenContract);
                    expect(ticket.tokenIds.length).to.equal(volley.tokenIds.length);

                });

                it("Should return empty array if no tickets await", async function () {

                    // Fetch the tickets
                    const result = await cannon.connect(recipient).myTickets();
                    expect(result.length).to.equal(0);

                });

            });

            context("claimTicket()", async function() {

                it("Should allow recipient of ticket to claim its nifties if they haven't transferred the ticket", async function () {

                    // Construct the Volley
                    volley = new Volley(
                        Mode.TICKET,
                        sender.address,
                        recipient.address,
                        snifty.address,
                        [27, 28, 29]
                    );

                    // Validate Volley
                    expect(volley.isValid()).is.true;

                    // Get next ticket id
                    ticketId = await cannon.connect(anon).getNextTicketId();

                    // Execute a ticketed send
                    await cannon.connect(sender).fireVolley(volley);

                    // Claim recipient's ticket
                    await expect(cannon.connect(recipient).claimTicket(ticketId))
                        .to
                        .emit(cannon, "VolleyTransferred")
                        .withArgs(sender.address, recipient.address, snifty.address, volley.tokenIds, volley.amounts);

                });

                it("Should allow new owner of a transferred ticket to claim the ticket", async function () {

                    // Construct the Volley
                    volley = new Volley(
                        Mode.TICKET,
                        sender.address,
                        recip1.address,
                        snifty.address,
                        [33, 34, 35]
                    );

                    // Validate Volley
                    expect(volley.isValid()).is.true;

                    // Get next ticket id
                    ticketId = await cannon.connect(anon).getNextTicketId();

                    // Execute a ticketed send
                    await cannon.connect(sender).fireVolley(volley);

                    // Transfer from recipient 1 to recipient 2
                    await cannon.connect(recip1).transferFrom(recip1.address, recip2.address, ticketId);

                    // Claim ticket as recipient 2, the current owner
                    await expect(cannon.connect(recip2).claimTicket(ticketId))
                        .to
                        .emit(cannon, "VolleyTransferred")
                        .withArgs(sender.address, recip2.address, snifty.address, volley.tokenIds, volley.amounts);

                });

                it("Should burn ticket once recipient has claimed it", async function () {

                    // Construct the Volley
                    volley = new Volley(
                        Mode.TICKET,
                        sender.address,
                        recipient.address,
                        snifty.address,
                        [36, 37, 38]
                    );

                    // Validate Volley
                    expect(volley.isValid()).is.true;

                    // Get next ticket id
                    ticketId = await cannon.connect(anon).getNextTicketId();

                    // Execute a ticketed send
                    await cannon.connect(sender).fireVolley(volley);

                    // Claim recipient's ticket
                    await expect(cannon.connect(recipient).claimTicket(ticketId))
                        .to
                        .emit(cannon, "VolleyTransferred")
                        .withArgs(sender.address, recipient.address, snifty.address, volley.tokenIds, volley.amounts);

                    // Attempt to ticket again
                    await expect(cannon.connect(recipient).claimTicket(ticketId))
                        .to
                        .revertedWith("Ticket has already been claimed.");

                });

            });

            context("claimAllTickets()", async function() {

                it("Should allow caller to claim multiple tickets", async function () {

                    // Construct the first Volley
                    volley1 = new Volley(
                        Mode.TICKET,
                        sender.address,
                        recipient.address,
                        snifty.address,
                        [39, 40]
                    );

                    // Construct the second Volley
                    volley2 = new Volley(
                        Mode.TICKET,
                        sender.address,
                        recipient.address,
                        snifty.address,
                        [41, 42]
                    );

                    // Validate Volleys
                    expect(volley1.isValid()).is.true;
                    expect(volley2.isValid()).is.true;

                    // Execute the will-call send
                    volleys = [volley1, volley2];
                    await cannon.connect(sender).fireVolleys(volleys);

                    // Claim Recipient ticket
                    await cannon.connect(recipient).claimAllTickets();

                    // Ensure recipient received all their tokens from first ticket
                    for (let i = 0; i < volley1.tokenIds.length; i++) {
                        expect(await snifty.ownerOf(volley1.tokenIds[i])).equal(recipient.address);
                    }

                    // Ensure recipient received all their tokens from second ticket
                    for (let i = 0; i < volley2.tokenIds.length; i++) {
                        expect(await snifty.ownerOf(volley2.tokenIds[i])).equal(recipient.address);
                    }

                });

            });

        });

        context("Revert reasons", async function() {

            it("Should revert if Cannon is not approved to transfer sender's tokens", async function() {

                // Construct the second Volley
                volley = new Volley(
                    Mode.TICKET,
                    sender.address,
                    recipient.address,
                    snifty.address,
                    [46]
                );

                // Validate Volleys
                expect(volley.isValid()).is.true;

                // Revoke approval for Cannon to manage sender's NFTs
                await snifty.connect(sender).setApprovalForAll(cannon.address, false);

                // Execute the will-call send
                await expect(cannon.connect(sender).fireVolley(volley))
                    .to
                    .revertedWith("Nifty Cannon not approved to transfer sender's NFTs");

            });

            it("Should revert if caller with no tickets to claim calls claimVolley", async function() {

                // Execute the will-call send
                await expect(cannon.claimVolley("0"))
                    .to
                    .revertedWith("Caller has no volleys to claim.");

            });

            it("Should revert if caller with waiting volleys provides invalid index to claimVolley", async function() {

                // Construct the Volley
                volley = new Volley(
                    Mode.WILLCALL,
                    sender.address,
                    recipient.address,
                    snifty.address,
                    [46]
                );

                // Validate Volleys
                expect(volley.isValid()).is.true;

                // Execute the will-call send
                await cannon.connect(sender).fireVolley(volley);

                // Make certain that an invalid volley index reverts
                await expect(cannon.connect(recipient).claimVolley(20))
                    .to
                    .revertedWith("Volley index out of bounds.")

            });

            it("Should revert if caller provides invalid ticket id to claimTicket", async function() {

                // Construct the Volley
                volley = new Volley(
                    Mode.TICKET,
                    sender.address,
                    recipient.address,
                    snifty.address,
                    [18, 19, 20]
                );

                // Validate Volley
                expect(volley.isValid()).is.true;

                // Get next ticket id
                ticketId = await cannon.connect(anon).getNextTicketId();

                // Execute a ticketed send
                await expect(cannon.connect(sender).fireVolley(volley))
                    .to
                    .emit(cannon,"VolleyTicketed")
                    .withArgs(sender.address, recipient.address, ticketId, snifty.address, volley.tokenIds, volley.amounts);

                // Make sure an invalid ticket id reverts
                await expect(cannon.connect(recipient).claimTicket(5000))
                    .to
                    .revertedWith("Invalid ticket id.");

            });

            it("Should revert if original recipient of ticket tries to claim after transferring the ticket", async function () {

                // Construct the Volley
                volley = new Volley(
                    Mode.TICKET,
                    sender.address,
                    recip1.address,
                    snifty.address,
                    [30, 31, 32]
                );

                // Validate Volley
                expect(volley.isValid()).is.true;

                // Get next ticket id
                ticketId = await cannon.connect(anon).getNextTicketId();

                // Execute a ticketed will-call send
                await expect(cannon.connect(sender).fireVolley(volley))
                    .to
                    .emit(cannon, "VolleyTicketed")
                    .withArgs(sender.address, recip1.address, ticketId, snifty.address, volley.tokenIds, volley.amounts);

                // Transfer it
                await cannon.connect(recip1).transferFrom(recip1.address, recip2.address, ticketId);

                // Attempt to claim ticket as origial recipient
                await expect(cannon.connect(recip1).claimTicket(ticketId))
                    .to
                    .revertedWith("Caller is not the owner of the ticket.");

            });

        });

    }

});
