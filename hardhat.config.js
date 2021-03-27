const environments = require('./environments');
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");

module.exports = {
  defaultNetwork: "hardhat",
  gasReporter: {
    currency: 'USD',
    gasPrice: 21
  },
  networks: {
    hardhat: {
      /*
      forking: {
        url: environments.rinkeby.forkNode,
        blockNumber: environments.rinkeby.forkBlock
      }
      */
    },
    rinkeby: {
      url: environments.rinkeby.txNode,
      accounts: {mnemonic: environments.rinkeby.mnemonic},
      gas: "auto"
    }
  },
  etherscan: {
    apiKey: environments.etherscan.apiKey
  },
  solidity: {
    version: "0.7.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 2000
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