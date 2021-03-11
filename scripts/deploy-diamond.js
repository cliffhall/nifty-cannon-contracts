const hre = require("hardhat");
const ethers = hre.ethers;
const FacetCutAction = {
    Add: 0,
    Replace: 1,
    Remove: 2
}

function getSelectors (contract) {
    const signatures = Object.keys(contract.interface.functions)
    const selectors = signatures.reduce((acc, val) => {
        if (val !== 'init(bytes)') {
            acc.push(contract.interface.getSighash(val))
        }
        return acc
    }, [])
    return selectors
}

async function main() {

    const accounts = await hre.ethers.provider.listAccounts();
    const deployer = accounts[0];
    console.log("Deployer account: ", deployer ? deployer : "not found" && process.exit() );

    // Deploy the Test, Cut, Loupe, Ownership, and Diamond facets

    // Test 1 Facet
    const Test1Facet = await hre.ethers.getContractFactory("Test1Facet");
    const test1Facet = await Test1Facet.deploy();
    await test1Facet.deployed();
    console.log("Test1Facet deployed to:", test1Facet.address);

    // Test 2
    const Test2Facet = await hre.ethers.getContractFactory("Test2Facet");
    const test2Facet = await Test2Facet.deploy();
    await test2Facet.deployed();
    console.log("Test2Facet deployed to:", test2Facet.address);

    // Diamond Cut Facet
    const DiamondCutFacet = await hre.ethers.getContractFactory("DiamondCutFacet");
    const diamondCutFacet = await DiamondCutFacet.deploy();
    await diamondCutFacet.deployed();
    console.log("DiamondCutFacet deployed to:", diamondCutFacet.address);

    // Diamond Loupe Facet
    const DiamondLoupeFacet = await hre.ethers.getContractFactory("DiamondLoupeFacet");
    const diamondLoupeFacet = await DiamondLoupeFacet.deploy();
    await diamondLoupeFacet.deployed();
    console.log("DiamondLoupeFacet deployed to:", diamondLoupeFacet.address);

    // Ownership Facet
    const OwnershipFacet = await hre.ethers.getContractFactory("OwnershipFacet");
    const ownershipFacet = await OwnershipFacet.deploy();
    await ownershipFacet.deployed().then(async () => {
        const diamondCut = [
            [diamondCutFacet.address, FacetCutAction.Add, getSelectors(diamondCutFacet)],
            [diamondLoupeFacet.address, FacetCutAction.Add, getSelectors(diamondLoupeFacet)],
            [ownershipFacet.address, FacetCutAction.Add, getSelectors(ownershipFacet)]
        ]
        const Diamond = await hre.ethers.getContractFactory("Diamond");
        const diamond = await Diamond.deploy(diamondCut, [deployer]);
        await diamond.deployed();
        console.log("Diamond deployed to:", diamond.address);
    });
    console.log("OwnershipFacet deployed to:", ownershipFacet.address);
    console.log("\n");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
