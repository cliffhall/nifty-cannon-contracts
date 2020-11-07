const { expect } = require("chai");

describe("Cannon", function() {

    it("Should deploy", async function() {

        const Cannon = await ethers.getContractFactory("Cannon");
        const cannon = await Cannon.deploy();

        await cannon.deployed();

    });

});
