require('dotenv').config();
require('@nomicfoundation/hardhat-toolbox');
module.exports = {
  solidity: '0.8.24',
  networks: { arbitrumSepolia: { url: process.env.RPC_URL, accounts: process.env.OWNER_KEY ? [process.env.OWNER_KEY] : [] } }
};
