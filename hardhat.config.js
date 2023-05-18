require("@nomiclabs/hardhat-waffle");
require("dotenv").config();
require("@nomiclabs/hardhat-etherscan");
// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.11",
  defaultNetwork: "neondevnet",
  networks: {
    
    neondevnet: {
      chainId: 245022926,
      url: process.env.RPC_URL,
      accounts: [process.env.NEON_ACCOUNTS],
    },   
  },
  etherscan: {
     apiKey: {
    neonevm: "test"
  },
  customChains: [
    {
      network: "neonevm",
      chainId: 245022926,
      urls: {
        apiURL: "https://devnet-api.neonscan.org/hardhat/verify",
        browserURL: "https://devnet.neonscan.org"
      }
    }
  ]
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./wallet-app/src/artifacts",
  },
};
