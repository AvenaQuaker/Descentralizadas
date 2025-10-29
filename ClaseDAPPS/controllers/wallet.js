require('dotenv').config({path:require('find-config')('.env')});
const {ethers} = require("ethers");
const contract = require("../artifacts/contracts/Wallet.sol/MultiSignPaymentWallet.json")
const { createTransaction,depositToContract,getContract} = require("../utils/contractHelper");
const { getPublicKey,getWallet } = require('../utils/accountManager');
const { publickeys } = require('../utils/accountManager');
const { WALLET_CONTRACT } = process.env;

async function sendTransaction(method,params,account){
    return await createTransaction(WALLET_CONTRACT,contract.abi,method,params,account);
}

async function submitTransaction(to,amount,account){
    return await sendTransaction("submitTransaction",[to,amount],account);
}

async function approveTransaction(transactionId,account){
    return await sendTransaction("approveTransaction",[transactionId],account);
}

async function executeTransaction(transactionId,account){
    return await sendTransaction("executeTransaction",[transactionId],account);
}

async function deposit(amount,account){
    console.log(WALLET_CONTRACT,amount,account)
    return await depositToContract(WALLET_CONTRACT,contract.abi,amount,account);
}

async function releasePayments(account){
    return await sendTransaction("releasePayments",[],account);
}

async function getBalance(){
    const wallet = getContract(WALLET_CONTRACT,contract.abi);
    const balance = await wallet.getBalance();
    console.log("Contract Balance",ethers.utils.formatEther(balance));
    return balance;
}

async function getTransactions(){
    const walletContract =  await getContract(WALLET_CONTRACT,contract.abi);
    const transactions = await walletContract.getTransactions();
    console.log(transactions);
    return transactions.map(formatTransaction);
}

async function pruebas(){
    const wallet = getContract(WALLET_CONTRACT, contract.abi);
    const tx = await wallet.transactions("0");
    console.log(tx);
}

function formatTransaction(info){
    return {
        to:info.to,
        amount: ethers.BigNumber.from(info.amount).toString(),
        approvalCount: ethers.BigNumber.from(info.approvalCount).toString(),
        executed: info.executed
    }
}

async function getApprovalDetails(){
    const approvals = await wallet.getApprovalsForTransaction(0);
    approvals.forEach(a => {
    console.log(`Aprobó: ${a.approver}, Fecha: ${new Date(a.timestamp * 1000)}`);
});
}

async function addProduct(name, price, account){
    return await sendTransaction("addProduct", [name, price], account);
}

async function buyProduct(productId, account) {
    try {
        const wallet = getWallet(account);
        const tienda = getContract(WALLET_CONTRACT, contract.abi).connect(wallet);

        const product = await tienda.products(productId);
        if (!product.active) throw new Error("Producto no disponible");

        const tx = await tienda.buyProduct(productId, {value: product.price,});
        const receipt = await tx.wait();

        return {
            success: true,
            transactionHash: receipt.transactionHash,
            blockNumber: receipt.blockNumber,
        };
    } catch (error) {
        console.error("Se Rompio algo:", error);
        throw error;
    }
}

async function updateProduct(productId, newName, newPrice, account) {
    try {
        const wallet = getWallet(account); 
        const tienda = getContract(WALLET_CONTRACT, contract.abi).connect(wallet);

        const priceInWei = ethers.utils.parseEther(newPrice.toString());
        const tx = await tienda.updateProduct(productId, newName, priceInWei);
        const receipt = await tx.wait();

        return {
            success: true,
            message: `Producto ${productId} actualizado correctamente`,
            transactionHash: receipt.transactionHash,
            blockNumber: receipt.blockNumber,
        };
    } catch (error) {
        console.error("Error al actualizar producto:", error);
        throw error;
    }
}


async function disableProduct(productId, account){
    return await sendTransaction("disableProduct", [productId], account);
}

async function getProducts(){
    const wallet = getContract(WALLET_CONTRACT, contract.abi);
    const products = await wallet.getAllProducts();
    return products.map(formatProduct);
}

function formatProduct(info){
    return {
        id: info.id.toString(),
        name: info.name,
        price: ethers.utils.formatEther(info.price),
        active: info.active,
        seller: info.seller
    }
}

module.exports = {
    deposit,
    submitTransaction,
    approveTransaction,
    executeTransaction,
    getApprovalDetails,
    releasePayments,
    getBalance,
    getTransactions,
    pruebas,
    addProduct,
    buyProduct,
    disableProduct,
    getProducts,
    updateProduct
};
