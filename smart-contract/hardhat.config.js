require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

const { PRIVATE_KEY } = process.env;

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
    polkadotTestnet: {
      url: "https://services.polkadothub-rpc.com/testnet",
      chainId: 420420417,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      // Polkadot Hub EVM does not support "pending" block tag —
      // force Ignition to use "latest" for nonce lookups
      ignition: {
        blockPollingInterval: 1_000,
        timeBeforeBumpingFees: 3 * 60 * 1_000,
        maxFeeBumps: 4,
        requiredConfirmations: 1,
      },
    },
  },
  etherscan: {
    apiKey: {
      polkadotTestnet: 'no-api-key-needed',
    },
    customChains: [
      {
        network: 'polkadotTestnet',
        chainId: 420420417,
        urls: {
          apiURL: 'https://blockscout-testnet.polkadot.io/api',
          browserURL: 'https://blockscout-testnet.polkadot.io/',
        },
      },
    ],
  },
};