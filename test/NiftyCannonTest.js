const { expect } = require("chai");

describe("NiftyCannon", function() {

    it("Should do something nice", async function() {

        const Greeter = await ethers.getContractFactory("NiftyCannon");
        const greeter = await NiftyCannon.deploy("Hello, world!");

        await greeter.deployed();
        expect(await greeter.greet()).to.equal("Hello, world!");

        await greeter.setGreeting("Hola, mundo!");
        expect(await greeter.greet()).to.equal("Hola, mundo!");
    });

});
