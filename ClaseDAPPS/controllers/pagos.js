require('dotenv').config({path:require('find-config')('.env')});
const {ethers} = require("ethers");
const contract = require("../artifacts/contracts/Pagos.sol/Pagos.json")
const { createTransaction,depositToContract,getContract} = require("../utils/contractHelper");
const { getPublicKey } = require('../utils/accountManager');
const { publickeys } = require('../utils/accountManager');
const { PAGOS_CONTRACT_ADDRESS } = process.env;

async function deposit(ammount,account){
    return await depositToContract(PAGOS_CONTRACT_ADDRESS,contract.abi,ammount,account)
}

async function releaseAll() {
    const pagosABI = contract.abi;

    for (let i = 0; i < publickeys.length; i++) {
        const address = publickeys[i];
        console.log(`Liberando fondos para: ${address}`);
        await createTransaction(PAGOS_CONTRACT_ADDRESS, pagosABI, 'release', [address], 0);
    }
}

async function release(account){
    const address = getPublicKey(account);
    return await createTransaction(PAGOS_CONTRACT_ADDRESS,contract.abi,"release",[address],account)
}
async function getBalance(){
    const pagos = getContract(PAGOS_CONTRACT_ADDRESS,contract.abi);
    const balance = await pagos.getBalance();
    console.log("Contract Balance",ethers.utils.formatEther(balance));
    return balance;
}
module.exports = {deposit,release,getBalance, releaseAll}