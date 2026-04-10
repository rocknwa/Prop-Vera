require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

const cronosApiKeyMainnet = process.env.MAINNET_API_KEY;
const cronosApiKeyTestnet = process.env.TESTNET_API_KEY;

module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "cancun",
    },
  },
  networks: {
    cronos: {
      url: "https://evm.cronos.org/",
      chainId: 25,
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: 10100000000000,
    },
    cronosTestnet: {
      url: "https://evm-t3.cronos.org/",
      chainId: 338,
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: 10100000000000,
    },
  },
  etherscan: {
    apiKey: {
      cronos: cronosApiKeyMainnet,
      cronosTestnet: cronosApiKeyTestnet,
    },
    customChains: [
      {
        network: "cronos",
        chainId: 25,
        urls: {
          apiURL:
            "https://explorer-api.cronos.org/mainnet/api/v1/hardhat/contract?apikey=" +
            cronosApiKeyMainnet,
          browserURL: "https://explorer.cronos.org",
        },
      },
      {
        network: "cronosTestnet",
        chainId: 338,
        urls: {
          apiURL:
            "https://explorer-api.cronos.org/testnet/api/v1/hardhat/contract?apikey=" +
            cronosApiKeyTestnet,
          browserURL: "https://explorer.cronos.org/testnet",
        },
      },
    ],
  },
};