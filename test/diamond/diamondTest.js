const hre = require("hardhat");
const ethers = hre.ethers;
const { assert, expect } = require("chai");

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

function findPositionInFacets (facetAddress, facets) {
  for (let i = 0; i < facets.length; i++) {
    if (facets[i].facetAddress === facetAddress) {
      return i
    }
  }
}

describe('DiamondTest', async () => {
  let diamondCutFacet;
  let diamondLoupeFacet;
  let ownershipFacet;
  let diamond;
  let test1Facet;
  let test2Facet;
  let result;
  let addresses;
  let deployer;
  let accounts;

  const zeroAddress = '0x0000000000000000000000000000000000000000'

  before(async () => {

    accounts = await ethers.getSigners();
    deployer = accounts[0].address;
    console.log("Deployer account: ", deployer ? deployer : "not found" && process.exit() );

    // Deploy the Test, Cut, Loupe, Ownership, and Diamond facets

    // Test 1 Facet
    const Test1Facet = await hre.ethers.getContractFactory("Test1Facet");
    test1Facet = await Test1Facet.deploy();
    await test1Facet.deployed();
    console.log("Test1Facet deployed to:", test1Facet.address);

    // Test 2
    const Test2Facet = await hre.ethers.getContractFactory("Test2Facet");
    test2Facet = await Test2Facet.deploy();
    await test2Facet.deployed();
    console.log("Test2Facet deployed to:", test2Facet.address);

    // Diamond Cut Facet
    const DiamondCutFacet = await hre.ethers.getContractFactory("DiamondCutFacet");
    const dcf = await DiamondCutFacet.deploy();
    await dcf.deployed();
    console.log("DiamondCutFacet deployed to:", dcf.address);

    // Diamond Loupe Facet
    const DiamondLoupeFacet = await hre.ethers.getContractFactory("DiamondLoupeFacet");
    const dlf = await DiamondLoupeFacet.deploy();
    await dlf.deployed();
    console.log("DiamondLoupeFacet deployed to:", dlf.address);

    // Ownership Facet
    const OwnershipFacet = await hre.ethers.getContractFactory("OwnershipFacet");
    const osf = await OwnershipFacet.deploy();
    await osf.deployed().then(async () => {
      const diamondCut = [
        [dcf.address, FacetCutAction.Add, getSelectors(dcf)],
        [dlf.address, FacetCutAction.Add, getSelectors(dlf)],
        [osf.address, FacetCutAction.Add, getSelectors(osf)]
      ]
      const Diamond = await hre.ethers.getContractFactory("Diamond");
      diamond = await Diamond.deploy(diamondCut, [deployer]);
      await diamond.deployed();
      console.log("Diamond deployed to:", diamond.address);
    });
    console.log("OwnershipFacet deployed to:", osf.address);

    // Diamond as Diamond Cut Facet
    diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', diamond.address);

    // Diamond as Diamond Loupe Facet
    diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', diamond.address);

    // Diamond as Ownership Facet
    ownershipFacet = await ethers.getContractAt('OwnershipFacet', diamond.address);

    deployer = accounts[0];
  })

  it('should have three facets -- call to facetAddresses function', async () => {
    addresses = await diamondLoupeFacet.facetAddresses();
    expect(addresses.length).to.equal(3);
  })

  it('facets should have the right function selectors -- call to facetFunctionSelectors function', async () => {
    let selectors = getSelectors(diamondCutFacet);
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[0]);
    assert.sameMembers(result, selectors)
    selectors = getSelectors(diamondLoupeFacet)
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[1]);
    assert.sameMembers(result, selectors)
    selectors = getSelectors(ownershipFacet)
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[2]);
    assert.sameMembers(result, selectors)
  })

  it('selectors should be associated to facets correctly -- multiple calls to facetAddress function', async () => {

    assert.equal(
      addresses[0],
      await diamondLoupeFacet.facetAddress('0x1f931c1c')
    )
    assert.equal(
      addresses[1],
      await diamondLoupeFacet.facetAddress('0xcdffacc6')
    )
    assert.equal(
      addresses[1],
      await diamondLoupeFacet.facetAddress('0x01ffc9a7')
    )
    assert.equal(
      addresses[2],
      await diamondLoupeFacet.facetAddress('0xf2fde38b')
    )
  })

  it('should get all the facets and function selectors of the diamond -- call to facets function', async () => {
    result = await diamondLoupeFacet.facets()
    assert.equal(result[0].facetAddress, addresses[0])
    let selectors = getSelectors(diamondCutFacet)
    assert.sameMembers(result[0].functionSelectors, selectors)
    assert.equal(result[1].facetAddress, addresses[1])
    selectors = getSelectors(diamondLoupeFacet)
    assert.sameMembers(result[1].functionSelectors, selectors)
    assert.equal(result[2].facetAddress, addresses[2])
    selectors = getSelectors(ownershipFacet)
    assert.sameMembers(result[2].functionSelectors, selectors)
    assert.equal(result.length, 3)
  })

  it('should add test1 functions', async () => {
    let selectors = getSelectors(test1Facet).slice(0,-1);
    addresses = [...addresses, test1Facet.address];
    await diamondCutFacet
      .connect(deployer)
      .diamondCut(
          [[test1Facet.address, FacetCutAction.Add, selectors]],
          zeroAddress,
          '0x');
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[3]);
    assert.sameMembers(result, selectors);
  })

  it('should test function call', async () => {
    const test1FacetDiamond = await ethers.getContractAt('Test1Facet', diamond.address);
    await test1FacetDiamond.connect(deployer).test1Func10();
  })

  it('should replace test1 function', async () => {
    let selectors = getSelectors(test1Facet).slice(-1);
    await diamondCutFacet
      .connect(deployer)
      .diamondCut(
          [[test1Facet.address, FacetCutAction.Replace, selectors]],
          zeroAddress,
          '0x'
      );
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[3])
    assert.sameMembers(result, getSelectors(test1Facet))
  })

  it('should add test2 functions', async () => {
    const selectors = getSelectors(test2Facet);
    addresses.push(test2Facet.address)
    await diamondCutFacet
      .connect(deployer)
      .diamondCut(
          [[test2Facet.address, FacetCutAction.Add, selectors]],
          zeroAddress,
          '0x'
      );
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[4])
    assert.sameMembers(result, selectors)
  })

  it('should remove some test2 functions', async () => {
    let selectors = getSelectors(test2Facet);
    let removeSelectors = [].concat(selectors.slice(0, 1), selectors.slice(4, 6), selectors.slice(-2))
    result = await diamondCutFacet
      .connect(deployer)
      .diamondCut(
          [[zeroAddress, FacetCutAction.Remove, removeSelectors]],
          zeroAddress,
          '0x'
      );
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[4]);
    selectors =
      [].concat(
        selectors.slice(-5, -4),
        selectors.slice(1, 4),
        selectors.slice(-4, -2),
        selectors.slice(6, -5)
      );
    assert.sameMembers(result, selectors);
  })

  it('should remove some test1 functions', async () => {
    let selectors = getSelectors(test1Facet);
    let removeSelectors = [].concat(selectors.slice(1, 2), selectors.slice(8, 10));
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[3]);
    result = await diamondCutFacet
      .connect(deployer)
      .diamondCut(
          [[zeroAddress, FacetCutAction.Remove, removeSelectors]],
          zeroAddress,
          '0x'
      );
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[3]);
    selectors = [].concat(selectors.slice(0, 1), selectors.slice(2, 8), selectors.slice(10));
    assert.sameMembers(result, selectors);
  })

  it('remove all functions and facets accept diamondCut and facets', async () => {
    let removeSelectors = [];
    let facets = await diamondLoupeFacet.facets();
    for (let i = 1; i < facets.length; i++) {
      removeSelectors.push(...facets[i].functionSelectors);
    }
    // remove the facets function
    removeItem(removeSelectors, '0x7a0ed627');

    result = await diamondCutFacet
      .connect(deployer)
      .diamondCut(
          [[zeroAddress, FacetCutAction.Remove, removeSelectors]],
          zeroAddress,
          '0x'
      );
    facets = await diamondLoupeFacet.facets();
    assert.equal(facets.length, 2);
    assert.equal(facets[0][0], addresses[0]);
    assert.sameMembers(facets[0][1], ['0x1f931c1c']);
    assert.equal(facets[1][0], addresses[1]);
    assert.sameMembers(facets[1][1], ['0x7a0ed627']);
  })

  it('add most functions and facets', async () => {
    const selectors = getSelectors(diamondLoupeFacet);
    removeItem(selectors, '0x7a0ed627'); // facets()
    removeItem(selectors, '0x01ffc9a7'); // supportsInterface()
    const diamondCut = [
      [addresses[1], FacetCutAction.Add, selectors],
      [addresses[2], FacetCutAction.Add, getSelectors(ownershipFacet)],
      [addresses[3], FacetCutAction.Add, getSelectors(test1Facet)],
      [addresses[4], FacetCutAction.Add, getSelectors(test2Facet)]
    ];
    result = await diamondCutFacet
      .connect(deployer)
      .diamondCut(
          diamondCut,
          zeroAddress,
          '0x'
      );
    const facets = await diamondLoupeFacet.facets();
    const facetAddresses = await diamondLoupeFacet.facetAddresses();
    assert.equal(facetAddresses.length, 5);
    assert.equal(facets.length, 5);
    assert.sameMembers(facetAddresses, addresses);
    assert.equal(facets[0][0], facetAddresses[0], 'first facet');
    assert.equal(facets[1][0], facetAddresses[1], 'second facet');
    assert.equal(facets[2][0], facetAddresses[2], 'third facet');
    assert.equal(facets[3][0], facetAddresses[3], 'fourth facet');
    assert.equal(facets[4][0], facetAddresses[4], 'fifth facet');
    assert.sameMembers(facets[findPositionInFacets(addresses[0], facets)][1], getSelectors(diamondCutFacet));
    assert.sameMembers(facets[findPositionInFacets(addresses[1], facets)][1], removeItem(getSelectors(diamondLoupeFacet), '0x01ffc9a7'))
    assert.sameMembers(facets[findPositionInFacets(addresses[2], facets)][1], getSelectors(ownershipFacet))
    assert.sameMembers(facets[findPositionInFacets(addresses[3], facets)][1], getSelectors(test1Facet))
    assert.sameMembers(facets[findPositionInFacets(addresses[4], facets)][1], getSelectors(test2Facet))
  })
})
