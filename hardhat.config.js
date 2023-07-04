/**
 * @type import('hardhat/config').HardhatUserConfig
 */
require('@nomiclabs/hardhat-waffle');
require('solidity-coverage');
require('dotenv').config({ path: __dirname + '/.env' });
require('./tasks');

const { INFURA_URL, PRIVATE_KEY } = process.env;

module.exports = {
  defaultNetwork: 'hardhat',
  networks: {
    rinkeby: {
      url: INFURA_URL,
      accounts: [`0x${PRIVATE_KEY}`]
    }
  },
  solidity: {
    compilers: [
      {
        version: '0.8.13',
        settings: {}
      }
    ]
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts'
  },
  mocha: {
    timeout: 40000
  }
};
