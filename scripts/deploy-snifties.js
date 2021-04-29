const hre = require("hardhat");
const ethers = hre.ethers;

let contract, contracts = [];
const divider = "-".repeat(80);

async function main() {

    // Compile everything (in case run by node)
    await hre.run('compile');

    console.log(`\n${divider}\nNetwork: ${hre.network.name}\nDeploying. ${new Date()}\n${divider}\n`);

    const accounts = await ethers.provider.listAccounts();
    const deployer = accounts[0];
    console.log("🔱 Deployer account: ", deployer ? deployer : "not found" && process.exit() );

    // We get the contracts to deploy
    const Sample721 = await ethers.getContractFactory("Sample721");
    const snifty = await Sample721.deploy();
    await snifty.deployed();
    deploymentComplete('Sample721', snifty.address, [] );

    const Sample1155 = await ethers.getContractFactory("Sample1155");
    const multi = await Sample1155.deploy();
    await multi.deployed();
    deploymentComplete('Sample1155', multi.address, [] );

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

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function deploymentComplete(name, address, args) {
    contracts.push({name, address, args});
    console.log(`✅ ${name} deployed to: ${address}`);
}


async function verifyOnEtherscan(contract) {
    console.log(`\n📋 Verifying ${contract.name}`);
    try {
        await hre.run("verify:verify", {
            address: contract.address,
            constructorArguments: contract.args,
        })
    } catch (e) {
        console.log(`❌ Failed to verify ${contract.name} on etherscan. ${e.message}`);
    }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
