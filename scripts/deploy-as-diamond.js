const hre = require("hardhat");
const ethers = hre.ethers;

let contract, contracts = [];
const divider = "-".repeat(80);

async function main() {

    const FacetCutAction = {
        Add: 0,
        Replace: 1,
        Remove: 2
    }

    console.log(`\n${divider}\nNetwork: ${hre.network.name}\nDeploying. ${new Date()}\n${divider}\n`);

    const accounts = await ethers.provider.listAccounts();
    const deployer = accounts[0];
    console.log("🔱Deployer account: ", deployer ? deployer : "not found" && process.exit() );

    // Deploy the Cannon, Cut, Loupe, Ownership, and Diamond facets

    // Cannon Facet
    const CannonFacet = await ethers.getContractFactory("CannonFacet");
    const ncf = await CannonFacet.deploy();
    await ncf.deployed();
    const cannonSelectors = getSelectors(ncf);
    removeItem(cannonSelectors, '0x01ffc9a7'); // EIP-165 supportsInterface() already exists
    const cannonCut = [ncf.address, FacetCutAction.Add, cannonSelectors];
    deploymentComplete('CannonFacet', ncf.address, [] );

    // Diamond Cut Facet
    const DiamondCutFacet = await ethers.getContractFactory("DiamondCutFacet");
    const dcf = await DiamondCutFacet.deploy();
    await dcf.deployed();
    const diamondCutSelectors = getSelectors(dcf);
    const diamondCutCut = [dcf.address, FacetCutAction.Add, diamondCutSelectors];
    deploymentComplete('DiamondCutFacet', dcf.address, [] );

    // Diamond Loupe Facet
    const DiamondLoupeFacet = await ethers.getContractFactory("DiamondLoupeFacet");
    const dlf = await DiamondLoupeFacet.deploy();
    await dlf.deployed();
    const diamondLoupeSelectors = getSelectors(dlf);
    const diamondLoupeCut = [dlf.address, FacetCutAction.Add, diamondLoupeSelectors];
    deploymentComplete('DiamondLoupeFacet', dlf.address, [] );

    // Ownership Facet
    const OwnershipFacet = await ethers.getContractFactory("OwnershipFacet");
    const osf = await OwnershipFacet.deploy();
    const ownershipSelectors = getSelectors(osf);
    const ownershipCut = [osf.address, FacetCutAction.Add, ownershipSelectors];
    await osf.deployed().then(async () => {

        deploymentComplete('OwnershipFacet', osf.address, [] );

        // Deploy Diamond with Cut, Loupe, Ownership, and Cannon facets pre-cut
        const diamondCut = [
            diamondCutCut,
            diamondLoupeCut,
            ownershipCut,
            cannonCut,
        ]
        const Cannon = await ethers.getContractFactory("Diamond");
        const cannon = await Cannon.deploy(diamondCut, [deployer]);
        await cannon.deployed();
        deploymentComplete('Diamond', cannon.address, [diamondCut, [deployer]] );

    });

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

}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getSelectors (contract) {
    const signatures = Object.keys(contract.interface.functions);
    const selectors = signatures.reduce((acc, val) => {
        if (val !== 'init(bytes)') {
            acc.push(contract.interface.getSighash(val))
        }
        return acc
    }, []);
    return selectors.reverse();
}

function removeItem (array, item) {
    array.splice(array.indexOf(item), 1)
    return array
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
