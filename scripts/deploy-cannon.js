const hre = require("hardhat");
const ethers = hre.ethers;
const {deployProxiedCannon} = require("./util/deploy-proxied-cannon");
const {delay, deploymentComplete, verifyOnEtherscan} = require("./util/report-verify-deployments");
const environments = require('../environments');
const network = hre.network.name;
const gasLimit = environments.gasLimit;

async function main() {

    // Compile everything (in case run by node)
    await hre.run('compile');

    // Deployed contracts
    let contracts = [];

    // Get accounts
    const accounts = await ethers.getSigners();
    const deployer = accounts[0];

    // Report header
    const divider = "-".repeat(80);
    console.log(`${divider}\n💥 Nifty Cannon Deployer\n${divider}`);
    console.log(`⛓ Network: ${network}\n📅 ${new Date()}`);
    console.log("🔱 Deployer account: ", deployer ? deployer.address : "not found" && process.exit() );
    console.log(divider);

    [cannon, proxy, proxyArgs] = await deployProxiedCannon(deployer.address, gasLimit);
    deploymentComplete('contracts/NiftyCannon.sol:NiftyCannon', cannon.address, [], contracts);
    deploymentComplete('contracts/NiftyCannonProxy.sol:NiftyCannonProxy', proxy.address, proxyArgs, contracts);

    // Bail now if deploying locally
    if (hre.network.name === 'hardhat') process.exit();

    // Wait a minute after deployment completes and then verify contracts on etherscan
    console.log('⏲ Pause one minute, allowing deployments to propagate to Etherscan backend...');
    await delay(60000).then(
        async () => {
            console.log('🔍 Verifying contracts on Etherscan...');
            while(contracts.length) {
                contract = contracts.shift()
                await verifyOnEtherscan(contract);
            }
        }
    );

    console.log("\n");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
