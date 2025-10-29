const { ethers } = require("hardhat");

    async function multiDeploy() {
    const owners = [
    "0x1881520890eCD07b9a0CAc5E49fd34e5Dc8dA8f8",
    "0x3bB94F092f247A37DA1832D802Ae2CC2cA8d4526",
    ];

    console.log("Desplegando contrato...");
    
    const partes = ["60", "40"];
    const requiredApprovals = 2;
    const multiSingWallet = await ethers.getContractFactory("MultiSignPaymentWallet");
    const wallet = await multiSingWallet.deploy(owners, requiredApprovals, owners, partes);
    console.log("Direcciones");
    console.log(owners);
    console.log("Gas Utilizado")
    console.log(wallet.deployTransaction.gasPrice);
    console.log("Adress")
    console.log(wallet.address);
    }

    multiDeploy()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error(error);
    process.exit(1); 
    });
