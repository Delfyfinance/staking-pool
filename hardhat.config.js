require("@nomiclabs/hardhat-waffle");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

const dotenv = require("dotenv").config();
const alchemyApiKey = process.env.ALCHEMY_API;
const mnemonic =  process.env.MNEMONIC
// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
   compilers: [
      {
        version: "0.8.4"
      },
      {
        version: "0.4.18"
      },
      {
        version: "0.5.16"
      },
      {
        version: "0.6.6"
      },
      {
        version: "0.6.12",
        settings: {  
          optimizer: {
            enabled: true,
            runs: 200
          }
        } 
      }
    ],
  },
  networks: {
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${alchemyApiKey}`,
      accounts: {mnemonic: mnemonic}
    },
    testnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      gasPrice: 20000000000,
      accounts: {mnemonic: mnemonic}
    },
  }
};
/* 
            ---- Rinkeby Testnet----
  Staking Address:  0x0cc8D40a82ce40F7BF4b515134e48f339913f148
Lower Cased Staking Address:  0x0cc8d40a82ce40f7bf4b515134e48f339913f148
Delfy Address:  0x82Cc6a610D0209b890Bd6B96Ae15eF8635f69d68
Basic Address:  0xB306918F045CE686690911497766F9980B5Ca466


            ---- Binance Testnet----
    Staking Address:  0x1AFE0b2FfE47Ea6c901f37D2De6D87E1828af5a4
    Lower Cased Staking Address:  0x1afe0b2ffe47ea6c901f37d2de6d87e1828af5a4
    Delfy Address:  0x4114Aa4B2366aB029036c569fF61c01a98346B33
    Basic Address:  0xbb2bbf4d1afbedC0d52E7EBd5d690a22F9183795
 */