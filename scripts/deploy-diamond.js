const hre = require("hardhat");
const ethers = hre.ethers;
const FacetCutAction = {
    Add: 0,
    Replace: 1,
    Remove: 2
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

async function main() {

    const accounts = await ethers.provider.listAccounts();
    const deployer = accounts[0];
    console.log("Deployer account: ", deployer ? deployer : "not found" && process.exit() );

    // Deploy the Cannnon, Cut, Loupe, Ownership, and Diamond facets

    // Cannon Facet
    const CannonFacet = await ethers.getContractFactory("CannonFacet");
    const ncf = await CannonFacet.deploy();
    await ncf.deployed();
    const cannonSelectors = getSelectors(ncf);
    removeItem(cannonSelectors, '0x01ffc9a7'); // EIP-165 supportsInterface() exists in
    const cannonCut = [ncf.address, FacetCutAction.Add, cannonSelectors];
    console.log("CannonFacet deployed to:", ncf.address);

    // Diamond Cut Facet
    const DiamondCutFacet = await ethers.getContractFactory("DiamondCutFacet");
    const dcf = await DiamondCutFacet.deploy();
    await dcf.deployed();
    const diamondCutSelectors = getSelectors(dcf);
    const diamondCutCut = [dcf.address, FacetCutAction.Add, diamondCutSelectors];
    console.log("DiamondCutFacet deployed to:", dcf.address);

    // Diamond Loupe Facet
    const DiamondLoupeFacet = await ethers.getContractFactory("DiamondLoupeFacet");
    const dlf = await DiamondLoupeFacet.deploy();
    await dlf.deployed();
    const diamondLoupeSelectors = getSelectors(dlf);
    const diamondLoupeCut = [dlf.address, FacetCutAction.Add, diamondLoupeSelectors];
    console.log("DiamondLoupeFacet deployed to:", dlf.address);

    // Ownership Facet
    const OwnershipFacet = await ethers.getContractFactory("OwnershipFacet");
    const osf = await OwnershipFacet.deploy();
    const ownershipSelectors = getSelectors(osf);
    const ownershipCut = [osf.address, FacetCutAction.Add, ownershipSelectors];
    await osf.deployed().then(async () => {

        console.log("OwnershipFacet deployed to:", osf.address);

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

        console.log("Diamond deployed to:", cannon.address);
    });
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
