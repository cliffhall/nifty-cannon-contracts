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

    // Deployed cannon, but failed during deployment of proxy
    const accounts = await ethers.getSigners();
    const deployer = accounts[0];
    const cannon = await ethers.getContractAt("NiftyCannon","0xc4184a4455d561249a29a570a1c35aebe733cfae", deployer);
    //const proxy = await ethers.getContractAt("contracts/NiftyCannonProxy.sol:NiftyCannonProxy","0xdE7BF3B8e8E6def078Ee9E8138773BED0B93755D", deployer);

    // Deploy Cannon
    //const cannon = await deployStandaloneCannon(gasLimit);

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