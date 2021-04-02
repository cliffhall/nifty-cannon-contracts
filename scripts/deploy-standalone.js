const hre = require("hardhat");
const ethers = hre.ethers;

async function main() {

    // Compile everything (in case run by node)
    await hre.run('compile');

    const accounts = await ethers.provider.listAccounts();
    console.log("Deployer account: ", accounts ? accounts[0] : "not found");

    // We get the contracts to deploy
    const Cannon = await ethers.getContractFactory("CannonFacet");
    const cannon = await Cannon.deploy();
    await cannon.deployed();

    const Sample721 = await ethers.getContractFactory("Sample721");
    const snifty = await Sample721.deploy();
    await snifty.deployed();

    console.log("Nifty Cannon deployed to:", cannon.address);
    console.log("Sample NFT deployed to:", snifty.address);
    console.log("\n");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
