const NiftyCannon = artifacts.require("./NiftyCannon.sol");
const BN = require('bn.js');

contract('NiftyCannon', function(accounts) {

    let contract;

    before(async () => {

        // Get the contract instance for this suite
        contract = await NiftyCannon.new();

    });

    it("should allow ", async function() {

        // Compute the expected result
        const expected = `${trait1.svg}${trait2.svg}`;

        // Get the concatenated string
        const result = await contract._strConcat(trait1.svg, trait2.svg);

        assert.equal(result, expected, "Concatenated string wasn't correct");

    });


});