const environments = require('./environments');
require("@nomiclabs/hardhat-waffle");
module.exports = {
  defaultNetwork: "hardhat",
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