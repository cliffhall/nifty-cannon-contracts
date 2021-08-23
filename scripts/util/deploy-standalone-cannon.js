const hre = require("hardhat");
const ethers = hre.ethers;

/**
 * Deploy the Nifty Cannon as a standalone contract
 *
 * Reused between deployment script and unit tests for consistency
 *
 * @param admin - the admin address for the proxy
 * @param gasLimit - gasLimit for transactions
 * @returns {Promise<(*|*|*)[]>}
 *
 * @author Cliff Hall <cliff@futurescale.com> (https://twitter.com/seaofarrows)
 */
async function deployStandaloneCannon(admin, gasLimit) {

    // Deploy Cannon
    const Cannon = await ethers.getContractFactory("NiftyCannon");
    const cannon = await Cannon.deploy({gasLimit});
    await cannon.deployed();

    return cannon;

}

if (require.main === module) {
    deployStandaloneCannon()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error)
            process.exit(1)
        })
}

exports.deployStandaloneCannon = deployStandaloneCannon