const hre = require("hardhat");
const ethers = hre.ethers;
const {delay, deploymentComplete, verifyOnEtherscan} = require("./util/report-verify-deployments");
const environments = require('../environments');
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
    console.log(`${divider}\n💥 Sample NFT Deployer\n${divider}`);
    console.log(`⛓ Network: ${hre.network.name}\n📅 ${new Date()}`);
    console.log("🔱 Deployer account: ", deployer ? deployer.address : "not found" && process.exit() );
    console.log(divider);

    // Deploy Sample 721
    const Sample721 = await ethers.getContractFactory("Sample721");
    const snifty = await Sample721.deploy({gasLimit});
    await snifty.deployed();
    deploymentComplete('Sample721', snifty.address, [], contracts );

    // Deploy Sample 1155
    const Sample1155 = await ethers.getContractFactory("Sample1155");
    const multi = await Sample1155.deploy({gasLimit});
    await multi.deployed();
    deploymentComplete('Sample1155', multi.address, [], contracts );

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
