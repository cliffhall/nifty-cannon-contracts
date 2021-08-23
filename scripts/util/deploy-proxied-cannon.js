const hre = require("hardhat");
const ethers = hre.ethers;
const {deployStandaloneCannon} = require("./deploy-standalone-cannon")

/**
 * Deploy the Nifty Cannon and its Transparent Proxy
 *
 * Reused between deployment script and unit tests for consistency
 *
 * @param admin - the admin address for the proxy
 * @param gasLimit - gasLimit for transactions
 * @returns {Promise<(*|*|*)[]>}
 *
 * @author Cliff Hall <cliff@futurescale.com> (https://twitter.com/seaofarrows)
 */
async function deployProxiedCannon (admin, gasLimit) {

    // Deploy Cannon
    const cannon = await deployStandaloneCannon();

    // Deploy Proxy
    const proxyArgs = [cannon.address, admin, []]
    const Proxy = await ethers.getContractFactory("NiftyCannonProxy");
    const proxy = await Proxy.deploy(...proxyArgs, {gasLimit});
    await proxy.deployed();

    return [cannon, proxy, proxyArgs];

}

if (require.main === module) {
    deployProxiedCannon()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error)
            process.exit(1)
        })
}

exports.deployProxiedCannon = deployProxiedCannon