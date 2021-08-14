const { expect } = require("chai");
const hre = require("hardhat");
const ethers = hre.ethers;
const Mode = require("../domain/Mode");
const Volley = require("../domain/Volley");
const Ticket = require("../domain/Ticket");

describe("NiftyCannon", async function() {

    let snifty, multi, cannon, accounts, sender, gasPrice;
    const TICKET_URI = "ipfs://QmdEkQjAXJAjPZtJFzJZJPxnBtu2FsoDGfH7EofA5sc6vT";
    const TOKEN_NAME = "Nifty Cannon Transferable Ticket";
    const TOKEN_SYMBOL = "FODDER";
    const multiTokenId1 = 0;
    const multiTokenId2 = 1;
    const niftiesToMint = 50;

    before( async function () {

        // Get accounts
        accounts = await ethers.getSigners();

        // Sender address
        sender = accounts[0].address;

    });

    describe("As a standalone contract, invoked directly", function() {

        before( async function () {

            // TODO: reusable deployment script for cannon and snifties

            // Deploy the contracts
            const Snifty = await ethers.getContractFactory("Sample721");
            snifty = await Snifty.deploy();
            await snifty.deployed();

            // Deploy the Sample1155 contract
            const Multi = await ethers.getContractFactory("Sample1155");
            multi = await Multi.deploy();
            await multi.deployed();

            const Cannon = await ethers.getContractFactory("NiftyCannon");
            cannon = await Cannon.deploy();
            await cannon.deployed();

            // Pre-mint some NFTs to transfer
            for (let i=0; i<niftiesToMint; i++) {
                await snifty.mintSample(sender);
            }

            // Pre-mint some ERC-1155 NFTs to transfer
            await multi.mintSample(sender, multiTokenId1, niftiesToMint);
            await multi.mintSample(sender, multiTokenId2, niftiesToMint);

            // Set approval for Cannon to manage sender's NFTs
            await snifty.setApprovalForAll(cannon.address, true);
            await multi.setApprovalForAll(cannon.address, true);

        });

        testCannon();

    })

    xdescribe("As a logic contract, invoked via proxy", function() {

        before( async function () {

            // todo

            let deployer = accounts[0];

        });

        //testCannon();

    })

    // Reusable tests
    function testCannon() {

        let ticketId = 0;

        context("fireVolley()", async function() {

            it("Should allow sender to airdrop multiple 721 NFTs to a single recipient with fireVolley", async function() {

                // Recipient
                const account = accounts[1];
                const address = account.address;

                // Construct the Volley and ensure it is valid
                const volley = new Volley(
                    Mode.AIRDROP,
                    sender,
                    address,
                    snifty.address,
                    [0,1]
                );
                expect(volley.isValid()).is.true;

                // Execute the airdrop send
                await expect(cannon.fireVolley(volley))
                    .to.emit(snifty, 'Transfer')
                    .withArgs(sender, address, 0);

                // Ensure recipient 1 received all their tokens
                for (let i=0; i<volley.tokenIds.length; i++){
                    expect(await snifty.ownerOf(volley.tokenIds[i])).equal(address);
                }

            });

            it("Should allow sender to airdrop an amount of an 1155 NFT to a single recipient with fireVolley", async function() {

                // Recipient
                const account = accounts[1];
                const recipient = account.address;
                const amount = 10;

                // Construct the Volley and ensure it is valid
                const volley = new Volley(
                    Mode.AIRDROP,
                    sender,
                    recipient,
                    multi.address,
                    [multiTokenId1],
                    [amount]
                );
                expect(volley.isValid()).is.true;

                // Execute the airdrop send
                await expect(cannon.fireVolley(volley))
                    .to.emit(multi, 'TransferSingle')
                    .withArgs(cannon.address, sender, recipient, multiTokenId1, amount);

                // Ensure recipient received all their tokens
                expect(await multi.balanceOf(recipient, multiTokenId1)).equal(amount);

            });

        });

        context("fireVolleys()", async function() {

            it("Should allow sender to airdrop multiple 721 NFTs to multiple recipients", async function() {

                // Recipients
                const recip1 = accounts[2].address;
                const recip2 = accounts[3].address;

                // Construct the Volley and ensure it is valid
                const volley1 = new Volley(
                    Mode.AIRDROP,
                    sender,
                    recip1,
                    snifty.address,
                    [2,3]
                );
                expect(volley1.isValid()).is.true;

                // Construct the Volley and ensure it is valid
                const volley2 = new Volley(
                    Mode.AIRDROP,
                    sender,
                    recip2,
                    snifty.address,
                    [4,5]
                );
                expect(volley2.isValid()).is.true;

                const volleys = [volley1, volley2];

                // Execute the airdrop send
                await cannon.fireVolleys(volleys);

                // Ensure recipient 2 received all their tokens
                for (let i=0; i<volley1.tokenIds.length; i++){
                    expect(await snifty.ownerOf(volley1.tokenIds[i])).equal(recip1);
                }

                // Ensure recipient 3 received all their tokens
                for (let i=0; i<volley2.tokenIds.length; i++){
                    expect(await snifty.ownerOf(volley2.tokenIds[i])).equal(recip2);
                }

            });

            it("Should allow sender to airdrop amounts of multiple 1155 NFTs to multiple recipients", async function() {

                // Recipients
                const recip1 = accounts[2].address;
                const recip2 = accounts[3].address;
                const amount = 10;

                // Construct the Volley and ensure it is valid
                const volley1 = new Volley(
                    Mode.AIRDROP,
                    sender,
                    recip1,
                    multi.address,
                    [multiTokenId1],
                    [amount]
                );
                expect(volley1.isValid()).is.true;

                // Construct the Volley and ensure it is valid
                const volley2 = new Volley(
                    Mode.AIRDROP,
                    sender,
                    recip2,
                    multi.address,
                    [multiTokenId1],
                    [amount]
                );
                expect(volley2.isValid()).is.true;

                const volleys = [volley1, volley2];

                // Execute the airdrop send
                await cannon.fireVolleys(volleys);

                // Make sure they arrived
                expect(await multi.balanceOf(recip1, multiTokenId1)).equal(amount);
                expect(await multi.balanceOf(recip2, multiTokenId1)).equal(amount);

            });

            it("Should allow sender to airdrop amounts of multiple 1155 NFTs to a single recipient as a batch", async function() {

                // Recipients
                const recip1 = accounts[4].address;
                const amount = 10;

                // Construct the Volley and ensure it is valid
                const volley = new Volley(
                    Mode.AIRDROP,
                    sender,
                    recip1,
                    multi.address,
                    [multiTokenId1, multiTokenId2],
                    [amount, amount]
                );
                expect(volley.isValid()).is.true;

                // Execute the airdrop send
                await cannon.fireVolley(volley);

                // Make sure they arrived
                expect(await multi.balanceOf(recip1, multiTokenId1)).equal(amount);
                expect(await multi.balanceOf(recip1, multiTokenId2)).equal(amount);

            });

        });
        
        it("Should allow recipient to pickup a single will-call volley with claimVolley", async function() {

            // Recipient
            const account = accounts[3];
            const recipient = account.address;

            // Construct the Volley
            const volley = new Volley(
                Mode.WILLCALL,
                sender,
                recipient,
                snifty.address,
                [6,7]
            );

            // Validate Volley
            expect(volley.isValid()).is.true;

            // Be sure there are no awaiting volleys for recipient
            expect(await cannon.connect(account).myWillCallCount()).to.equal(0);

            // Execute the will-call send
            await cannon.fireVolley(volley);

            // Be sure there is one awaiting volley for recipient
            expect(await cannon.connect(account).myWillCallCount()).to.equal(1);

            // Pickup recipient's volley on will-call
            await cannon.connect(account).claimVolley(0);

            // Ensure recipient has all their tokens on will-call
            for (let i=0; i<volley.tokenIds.length; i++){
                expect(await snifty.ownerOf(volley.tokenIds[i])).equal(recipient);
            }

        });

        it("Should allow recipient to pickup multiple will-call volleys with claimAllVolleys", async function() {

            // Recipient
            const account = accounts[4];
            const recipient = account.address;

            // Construct the first Volley
            const volley1 = new Volley(
                Mode.WILLCALL,
                sender,
                recipient,
                snifty.address,
                [8,9]
            );

            // Construct the second Volley
            const volley2 = new Volley(
                Mode.WILLCALL,
                sender,
                recipient,
                snifty.address,
                [10,11]
            );

            // Validate Volleys
            expect(volley1.isValid()).is.true;
            expect(volley2.isValid()).is.true;

            // Be sure there are no awaiting volleys
            expect(await cannon.connect(account).myWillCallCount()).to.equal(0);

            // Execute the will-call send
            const volleys = [volley1, volley2];
            await cannon.fireVolleys(volleys);

            // Be sure there are two awaiting volleys
            expect(await cannon.connect(account).myWillCallCount()).to.equal(2);

            // Pickup Recipient's volley on will-call
            await cannon.connect(account).claimAllVolleys();

            // Ensure recipient received all their tokens from first volley
            for (let i=0; i<volley1.tokenIds.length; i++){
                expect(await snifty.ownerOf(volley1.tokenIds[i])).equal(recipient);
            }

            // Ensure recipient received all their tokens from second volley
            for (let i=0; i<volley2.tokenIds.length; i++){
                expect(await snifty.ownerOf(volley2.tokenIds[i])).equal(recipient);
            }

        });

        it("Should allow anyone to check the count of will-call volleys awaiting them", async function() {

            // Recipient
            const account = accounts[5];
            const recipient = account.address;

            // Construct the Volley
            const volley = new Volley(
                Mode.WILLCALL,
                sender,
                recipient,
                snifty.address,
                [12, 13, 14]
            );

            // Validate Volley
            expect(volley.isValid()).is.true;

            // When no volleys have been sent to the recipient, the count should be 0
            expect(await cannon.connect(account).myWillCallCount()).to.equal(0);

            // Execute a will-call send
            await cannon.fireVolley(volley);

            // Be sure there is one awaiting volley for recipient
            expect(await cannon.connect(account).myWillCallCount()).to.equal(1);

        });

        it("Should allow recipient to fetch a list of their waiting will-call volleys", async function() {

            // Recipient
            const account = accounts[5];
            const recipient = account.address;

            // Construct the Volley (sent in previous test but not picked up)
            const volley = new Volley(
                Mode.WILLCALL,
                sender,
                recipient,
                snifty.address,
                [12, 13, 14]
            );

            // Validate Volley
            expect(volley.isValid()).is.true;

            // Fetch the volleys
            const result = await cannon.connect(recipient).myVolleys();
            expect(result.length).to.equal(1);
            expect(result[0].sender).to.equal(volley.sender);
            expect(result[0].recipient).to.equal(volley.recipient);
            expect(result[0].tokenContract).to.equal(volley.tokenContract);
            expect(result[0].tokenIds.length).to.equal(volley.tokenIds.length);

        });

        it("Should return empty array if no volleys await", async function() {

            // Recipient
            const account = accounts[6];
            const recipient = account.address;

            // Fetch the volleys
            const result = await cannon.connect(recipient).myVolleys();
            expect(result.length).to.equal(0);

        });

        it("Should emit a VolleyTransferred event upon successful airdrop", async function() {

            // Recipient
            const account = accounts[6];
            const recipient = account.address;

            // Construct the Volley
            const volley = new Volley(
                Mode.AIRDROP,
                sender,
                recipient,
                snifty.address,
                [15, 16, 17]
            );

            // Validate Volley
            expect(volley.isValid()).is.true;

            // Execute a will-call send
            await expect(cannon.fireVolley(volley))
                .to
                .emit(cannon,"VolleyTransferred")
                .withArgs(sender, recipient, snifty.address, volley.tokenIds, volley.amounts);

        });

        it("Should emit a VolleyStored event upon successful storage of will-call volley", async function() {

            // Recipient
            const account = accounts[6];
            const recipient = account.address;

            // Construct the Volley
            const volley = new Volley(
                Mode.WILLCALL,
                sender,
                recipient,
                snifty.address,
                [18, 19, 20]
            );

            // Validate Volley
            expect(volley.isValid()).is.true;

            // Execute a will-call send
            await expect(cannon.fireVolley(volley))
                .to
                .emit(cannon,"VolleyStored")
                .withArgs(sender, recipient, snifty.address, volley.tokenIds, volley.amounts);

        });

        it("Should emit a VolleyTransferred event upon successful will-call pickup", async function() {

            // Recipient
            const account = accounts[8];
            const recipient = account.address;

            // Construct the Volley
            const volley = new Volley(
                Mode.WILLCALL,
                sender,
                recipient,
                snifty.address,
                [21, 22, 23]
            );

            // Validate Volley
            expect(volley.isValid()).is.true;

            // Execute a will-call send
            await expect(cannon.fireVolley(volley))
                .to
                .emit(cannon,"VolleyStored")
                .withArgs(sender, recipient, snifty.address, volley.tokenIds, volley.amounts);

            // Pickup recipient's volley on will-call
            await expect(cannon.connect(account).claimVolley(0))
                .to
                .emit(cannon, "VolleyTransferred")
                .withArgs(sender, recipient, snifty.address, volley.tokenIds, volley.amounts);

        });

        it("Should emit a VolleyTicketed event & recipient owns ticket upon issue of transferable ticket", async function() {

            // Recipient
            const account = accounts[9];
            const recipient = account.address;

            // Construct the Volley
            const volley = new Volley(
                Mode.TICKET,
                sender,
                recipient,
                snifty.address,
                [21, 22, 23]
            );

            // Validate Volley
            expect(volley.isValid()).is.true;

            // Execute a will-call send
            await expect(cannon.fireVolley(volley))
                .to
                .emit(cannon,"VolleyTicketed")
                .withArgs(sender, recipient, ticketId, snifty.address, volley.tokenIds, volley.amounts);

            // Recipient should own the the NFT for the ticket
            expect(await cannon.ownerOf(ticketId)).equal(recipient);

        });

        it("Should increment ticketId upon successful issue of transferable ticket", async function() {

            // Recipient
            const account = accounts[10];
            const recipient = account.address;

            // Construct the Volley
            const volley = new Volley(
                Mode.TICKET,
                sender,
                recipient,
                snifty.address,
                [24, 25, 26]
            );

            // Increment expected Ticket ID
            ticketId++;

            // Validate Volley
            expect(volley.isValid()).is.true;

            // Execute a will-call send
            await expect(cannon.fireVolley(volley))
                .to
                .emit(cannon,"VolleyTicketed")
                .withArgs(sender, recipient, ticketId, snifty.address, volley.tokenIds, volley.amounts);

        });

        it("Should allow recipient to fetch a list of their waiting transferable tickets", async function() {

            // Recipient
            const account = accounts[10];
            const recipient = account.address;

            // Construct the Ticket (created in previous test)
            const ticket = new Ticket(
                ticketId,
                sender,
                snifty.address,
                [24, 25, 26]
            );

            // Validate Ticket
            expect(ticket.isValid()).is.true;

            // Fetch the tickets
            const result = await cannon.connect(recipient).myTickets();
            expect(result.length).to.equal(1);
            expect(result[0].sender).to.equal(ticket.sender);
            expect(result[0].tokenContract).to.equal(ticket.tokenContract);
            expect(result[0].tokenIds.length).to.equal(ticket.tokenIds.length);

        });

        it("Should allow recipient of ticket to claim its nifties if they haven't transferred the ticket", async function() {

            // Recipient
            const account = accounts[11];
            const recipient = account.address;

            // Construct the Volley
            const volley = new Volley(
                Mode.TICKET,
                sender,
                recipient,
                snifty.address,
                [27, 28, 29]
            );

            // Increment expected Ticket ID
            ticketId++;

            // Validate Volley
            expect(volley.isValid()).is.true;

            // Execute a ticketed will-call send
            await expect(cannon.fireVolley(volley))
                .to
                .emit(cannon,"VolleyTicketed")
                .withArgs(sender, recipient, ticketId, snifty.address, volley.tokenIds, volley.amounts);

            // Claim recipient's ticket
            await expect(cannon.connect(account).claimTicket(ticketId))
                .to
                .emit(cannon, "VolleyTransferred")
                .withArgs(sender, recipient, snifty.address, volley.tokenIds, volley.amounts);

        });

        it("Should not allow recipient of ticket to claim its nifties if they've transferred the ticket", async function() {

            // Recipient
            const account = accounts[12];
            const recip1 = account.address;

            // Transfer to
            const buyer = accounts[13];
            const recip2 = buyer.address;

            // Construct the Volley
            const volley = new Volley(
                Mode.TICKET,
                sender,
                recip1,
                snifty.address,
                [30, 31, 32]
            );

            // Increment expected Ticket ID
            ticketId++;

            // Validate Volley
            expect(volley.isValid()).is.true;

            // Execute a ticketed will-call send
            await expect(cannon.fireVolley(volley))
                .to
                .emit(cannon,"VolleyTicketed")
                .withArgs(sender, recip1, ticketId, snifty.address, volley.tokenIds, volley.amounts);

            // Transfer it
            await cannon.connect(account).transferFrom(recip1, recip2, ticketId);

            // Attempt to claim ticket as origial recipient
            await expect(cannon.connect(account).claimTicket(ticketId))
                .to
                .revertedWith("Caller is not the owner of the ticket.");

        });

        it("Should allow current owner of a transferred ticket to claim the ticket", async function() {

            // Recipient
            const account = accounts[13];
            const recip1 = account.address;

            // Transfer to
            const buyer = accounts[14];
            const recip2 = buyer.address;

            // Construct the Volley
            const volley = new Volley(
                Mode.TICKET,
                sender,
                recip1,
                snifty.address,
                [33, 34, 35]
            );

            // Increment expected Ticket ID
            ticketId++;

            // Validate Volley
            expect(volley.isValid()).is.true;

            // Execute a ticketed will-call send
            await expect(cannon.fireVolley(volley))
                .to
                .emit(cannon,"VolleyTicketed")
                .withArgs(sender, recip1, ticketId, snifty.address, volley.tokenIds, volley.amounts);

            // Transfer it
            await cannon.connect(account).transferFrom(recip1, recip2, ticketId);

            // Claim ticket as buyer and current owner
            await expect(cannon.connect(buyer).claimTicket(ticketId))
                .to
                .emit(cannon, "VolleyTransferred")
                .withArgs(sender, recip2, snifty.address, volley.tokenIds, volley.amounts);

        });

        it("Should return empty array if no tickets await", async function() {

            // Recipient
            const account = accounts[14];
            const recipient = account.address;

            // Fetch the tickets
            const result = await cannon.connect(recipient).myTickets();
            expect(result.length).to.equal(0);

        });

        it("Should burn ticket once recipient has claimed it", async function() {

            // Recipient
            const account = accounts[15];
            const recipient = account.address;

            // Construct the Volley
            const volley = new Volley(
                Mode.TICKET,
                sender,
                recipient,
                snifty.address,
                [36, 37, 38]
            );

            // Increment expected Ticket ID
            ticketId++;

            // Validate Volley
            expect(volley.isValid()).is.true;

            // Execute a ticketed send
            await expect(cannon.fireVolley(volley))
                .to
                .emit(cannon,"VolleyTicketed")
                .withArgs(sender, recipient, ticketId, snifty.address, volley.tokenIds, volley.amounts);

            // Claim recipient's ticket
            await expect(cannon.connect(account).claimTicket(ticketId))
                .to
                .emit(cannon, "VolleyTransferred")
                .withArgs(sender, recipient, snifty.address, volley.tokenIds, volley.amounts);

            // Attempt to ticket again
            await expect(cannon.connect(account).claimTicket(ticketId))
                .to
                .revertedWith("Ticket has already been claimed.");

        });

        it("Should allow caller to pickup multiple tickets with claimAllTickets", async function() {

            // Recipient
            const account = accounts[16];
            const recipient = account.address;

            // Construct the first Volley
            const volley1 = new Volley(
                Mode.TICKET,
                sender,
                recipient,
                snifty.address,
                [39,40]
            );

            // Construct the second Volley
            const volley2 = new Volley(
                Mode.TICKET,
                sender,
                recipient,
                snifty.address,
                [41,42]
            );

            // Validate Volleys
            expect(volley1.isValid()).is.true;
            expect(volley2.isValid()).is.true;

            // Increment expected Ticket ID
            ticketId++;
            ticketId++;

            // Execute the will-call send
            const volleys = [volley1, volley2];
            await cannon.fireVolleys(volleys);

            // Claim Recipient ticket
            await cannon.connect(account).claimAllTickets();

            // Ensure recipient received all their tokens from first ticket
            for (let i=0; i<volley1.tokenIds.length; i++){
                expect(await snifty.ownerOf(volley1.tokenIds[i])).equal(recipient);
            }

            // Ensure recipient received all their tokens from second ticket
            for (let i=0; i<volley2.tokenIds.length; i++){
                expect(await snifty.ownerOf(volley2.tokenIds[i])).equal(recipient);
            }

        });

        it("Should return the appropriate value for tokenURI", async function() {

            // Recipient
            const account = accounts[17];
            const recipient = account.address;

            // Construct the second Volley
            const volley = new Volley(
                Mode.TICKET,
                sender,
                recipient,
                snifty.address,
                [43,44,45]
            );

            // Validate Volleys
            expect(volley.isValid()).is.true;

            // Increment expected Ticket ID
            ticketId++;

            // Execute the will-call send
            await cannon.fireVolley(volley);

            // Check token URI
            expect(await cannon.tokenURI(ticketId)).equal(TICKET_URI);

        });

        it("Should revert if Cannon is not approved to transfer sender's tokens", async function() {

            // Recipient
            const account = accounts[18];
            const recipient = account.address;

            // Construct the second Volley
            const volley = new Volley(
                Mode.TICKET,
                sender,
                recipient,
                snifty.address,
                [46]
            );

            // Validate Volleys
            expect(volley.isValid()).is.true;

            // Revoke approval for Cannon to manage sender's NFTs
            await snifty.setApprovalForAll(cannon.address, false);

            // Execute the will-call send
            await expect(cannon.fireVolley(volley))
                .to
                .revertedWith("Nifty Cannon not approved to transfer sender's NFTs");

            // Restore approval
            await snifty.setApprovalForAll(cannon.address, true);
        });

        it("Should revert if caller with no tickets to claim calls claimVolley", async function() {

            // Recipient
            const account = accounts[19];
            const recipient = account.address;

            // Execute the will-call send
            await expect(cannon.claimVolley("0"))
                .to
                .revertedWith("Caller has no volleys to claim.");

            // Restore approval
            await snifty.setApprovalForAll(cannon.address, true);
        });

        it("Should revert if caller with waiting volleys provides invalid index to claimVolley", async function() {

            // Recipient
            const account = accounts[19];
            const recipient = account.address;

            // Construct the Volley
            const volley = new Volley(
                Mode.WILLCALL,
                sender,
                recipient,
                snifty.address,
                [46]
            );

            // Validate Volleys
            expect(volley.isValid()).is.true;

            // Increment expected Ticket ID
            ticketId++;

            // Execute the will-call send
            await cannon.fireVolley(volley);

            // Make certain that an invalid volley index reverts
            await expect(cannon.connect(account).claimVolley(20))
                .to
                .revertedWith("Volley index out of bounds.")

        });

        it("Should revert if caller provides invalid ticket id to claimTicket", async function() {

            // Recipient
            const account = accounts[19];
            const recipient = account.address;

            // Construct the Volley
            const volley = new Volley(
                Mode.WILLCALL,
                sender,
                recipient,
                snifty.address,
                [18, 19, 20]
            );

            // Validate Volley
            expect(volley.isValid()).is.true;

            // Execute a will-call send
            await expect(cannon.fireVolley(volley))
                .to
                .emit(cannon,"VolleyStored")
                .withArgs(sender, recipient, snifty.address, volley.tokenIds, volley.amounts);

            // Make sure an invalid ticket id reverts
            await expect(cannon.connect(account).claimTicket(5000))
                .to
                .revertedWith("Invalid ticket id.");

        });

    }

});
