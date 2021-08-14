const environments = require('./environments');
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      initialBaseFeePerGas: 0
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
    version: "0.8.3",
    settings: {
      optimizer: {
        enabled: true,
        runs: 2000
      }
    }
  },
  gasReporter: {
    currency: 'USD',
    enabled: true,
    gasPrice: 82,
    coinmarketcap: environments.coinmarketcap.apiKey,
    showTimeSpent: true,
    showMethodSig: true
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};