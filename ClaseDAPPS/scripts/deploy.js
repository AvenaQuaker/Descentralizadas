const hre = require("hardhat");
const dotenv = require("dotenv")
dotenv.config()

async function main() {
    const Owner = process.env.OWNER

  console.log("Desplegando PersonalManager...");
  const Personal = await hre.ethers.getContractFactory("PersonalManager");
  const personal = await Personal.deploy();
  await personal.deployed();
  console.log("PersonalManager deployed at:", personal.address);

  console.log("Desplegando MultiSignPaymentWallet...");
  const Wallet = await hre.ethers.getContractFactory("MultiSignPaymentWallet");
  const wallet = await Wallet.deploy();
  await wallet.deployed();
  console.log("MultiSignPaymentWallet deployed at:", wallet.address);

  console.log("Desplegando Pagos...");
  const Pagos = await hre.ethers.getContractFactory("Pagos");

const pagos = await Pagos.deploy(
    [Owner],  
    [100]   
);
  await pagos.deployed();
  console.log("Pagos deployed at:", pagos.address);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
