require("@nomiclabs/hardhat-ethers")
require('dotenv').config({path:require('find-config')('.env')});

console.log(process.env.API_URL);;
console.log(process.env.PRIVATE_KEY);
module.exports = {
  solidity: "0.8.28",
  defaultNetwork:"sepolia",
  networks:{
    sepolia:{
      url: process.env.API_URL,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
