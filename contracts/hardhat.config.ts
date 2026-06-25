import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";
const LITVM_RPC_URL = process.env.LITVM_RPC_URL || "https://liteforge.rpc.caldera.xyz/http";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
      evmVersion: "paris",
    },
  },
  networks: {
    hardhat: {},
    litvmTestnet: {
      url: LITVM_RPC_URL,
      chainId: 4441,
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      litvmTestnet: process.env.LITVM_EXPLORER_API_KEY || "empty",
    },
    customChains: [
      {
        network: "litvmTestnet",
        chainId: 4441,
        urls: {
          apiURL: "https://liteforge.explorer.caldera.xyz/api",
          browserURL: "https://liteforge.explorer.caldera.xyz",
        },
      },
    ],
  },
};

export default config;
