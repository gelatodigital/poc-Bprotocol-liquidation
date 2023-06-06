import { HardhatUserConfig } from "hardhat/config";

// PLUGINS
import "@gelatonetwork/web3-functions-sdk/hardhat-plugin";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomiclabs/hardhat-ethers";
import "@typechain/hardhat";

// Process Env Variables
import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + "/.env" });

const PK = process.env.PK;
const ALCHEMY_ID = process.env.ALCHEMY_ID;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

// HardhatUserConfig bug
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config: HardhatUserConfig = {
  defaultNetwork: "localhost",

  // web3 functions
  w3f: {
    rootDir: "./src/web3-functions",
    debug: false,
    networks: ["hardhat", "fantom"], //(multiChainProvider) injects provider for these networks
  },

  networks: {
    hardhat: {
      forking: {
        url: "https://rpc.ankr.com/fantom", //"https://rpc.ftm.tools",
        blockNumber: 63471469, //40227564,//
      },
    },
    localhost: {
      url: "http://localhost:8545",
      chainId: 31337,
    },
    ethereum: {
      accounts: PK ? [PK] : [],
      chainId: 1,
      url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_ID}`,
    },
    fantom: {
      accounts: PK ? [PK] : [],
      chainId: 250,
      url: "https://rpc.ftm.tools",
    },
  },

  solidity: {
    compilers: [
      {
        version: "0.8.18",
        settings: {
          optimizer: { enabled: true, runs: 200 },
        },
      },
    ],
  },

  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
};

export default config;
