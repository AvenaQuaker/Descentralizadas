const { ethers } = require("ethers");
const contract = require("../artifacts/contracts/Wallet.sol/MultiSignPaymentWallet.json");
const {  getContract, createTransaction } = require("../utils/contractHelper.js");
const { getWallet, provider } = require('../utils/accountManager.js');
const { WALLET_CONTRACT } = process.env;

async function getProducts(){
  const wallet = getContract(WALLET_CONTRACT, contract.abi);
  const products = await wallet.getProducts();   
  if(!products || products.length === 0) return [];
  return products.map(formatProduct).filter(p => p.id !== "0");
}

function formatProduct(info){
  return {
    id: info.id.toString(),
    name: info.name,
    description: info.description,
    price: ethers.utils.formatEther(info.price), 
    stock: info.stock.toString(),
    imageUrl: info.imageUrl,
    active: info.active,
    seller: info.seller
  };
}

async function addProduct(name, description, price, stock, imageUrl, account) {
    const priceWei = ethers.utils.parseEther(price.toString());

    return await createTransaction(
        WALLET_CONTRACT,
        contract.abi,
        "createProduct",
        [name, description, priceWei, stock, imageUrl],
        account
    );
}

async function updateProductController(id, name, description, priceInEth, stock, imageUrl, active, account) {
    try {
        const parsedPrice = ethers.utils.parseEther(priceInEth.toString())

        const receipt = await createTransaction(
            WALLET_CONTRACT,     
            contract.abi,        
            "updateProduct",    
            [id, name, description, parsedPrice, stock, imageUrl, active],
            account           
        )

        return {
            success: true,
            txHash: receipt.transactionHash
        }

    } catch (err) {
        console.error("Error en updateProductController:", err)
        return { success: false, error: err.message }
    }
}

async function deleteProductController(productId, account) {
    walletABI = contract.abi;

    return await createTransaction(
        WALLET_CONTRACT,    
        walletABI,            
        "deleteProduct",      
        [productId],          
        account               
    );
}

async function getPurchasesByUser(walletAddress){
  const inst = getContract(WALLET_CONTRACT, contract.abi);
  const purchases = await inst.getPurchasesByUser(walletAddress);
  return purchases.map(p => ({
    id: p.id.toString(),
    productId: p.productId.toString(),
    buyer: p.buyer,
    amount: ethers.utils.formatEther(p.amount),
    timestamp: Number(p.timestamp)
  }));
}

async function getWalletBalance(walletAddress) {
    try {
        const balanceWei = await provider.getBalance(walletAddress);
        return ethers.utils.formatEther(balanceWei);
    } catch (err) {
        console.error("Error getting wallet balance:", err);
        return "0";
    }
}

async function totalBalance() {
    const balanceWei = await provider.getBalance(WALLET_CONTRACT)
    return ethers.utils.formatEther(balanceWei) 
}

async function PagarAlOwner(amountEth) {
    try {
        const wallet = getWallet() 
        const instance = new ethers.Contract(WALLET_CONTRACT, contract.abi, wallet)

        const value = ethers.utils.parseEther(String(amountEth))

        const tx = await instance.withdraw(wallet.address, value)
        const receipt = await tx.wait()

        console.log("Withdraw TX:", receipt.transactionHash)

        return {
            success: true,
            txHash: receipt.transactionHash
        }
    } catch (err) {
        console.error("Error en withdrawToOwner:", err)
        return {
            success: false,
            message: err.message || err.toString()
        }
    }
}

module.exports = {
  getProducts,
  addProduct,
  updateProductController,
  deleteProductController,
  getPurchasesByUser,
  getWalletBalance,
  totalBalance,
  PagarAlOwner
}
