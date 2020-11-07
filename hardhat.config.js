const environments = require('./environments');
module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      forking: {
        url: environments.rinkeby.alchemy,
        blockNumber: 7507432
      }
    },
    rinkeby: {
      url: environments.rinkeby.infura,
      accounts: {mnemonic: environments.rinkeby.mnemonic},
      gas: "auto"
    }
  },
  solidity: {
    version: "0.7.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};