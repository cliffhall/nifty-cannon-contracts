const NiftyCannon = artifacts.require("./NiftyCannon.sol");

module.exports = (deployer) => {
    deployer.then(async () => {

        // Deploy the contracts
        console.log("Deploying contracts...");
        await deployer.deploy(NiftyCannon);

    });
};