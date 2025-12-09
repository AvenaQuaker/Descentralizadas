const { ethers } = require("ethers");
const contract = require("../artifacts/contracts/Wallet.sol/MultiSignPaymentWallet.json");
const {  getContract, createTransaction } = require("../utils/contractHelper.js");
const { getWallet, provider } = require('../utils/accountManager.js');
const { WALLET_CONTRACT } = process.env;

async function getProducts(){
  const wallet = getContract(WALLET_CONTRACT, contract.abi);
  const products = await wallet.getProducts();      // <-- coincide con tu contrato
  if(!products || products.length === 0) return [];
  return products.map(formatProduct).filter(p => p.id !== "0");
}

function formatProduct(info){
  return {
    id: info.id.toString(),
    name: info.name,
    description: info.description,
    price: ethers.utils.formatEther(info.price), // retorna string en ETH legible
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


// Comprar un producto desde la wallet del user (necesita que el backend tenga access a la key o el usuario firme en frontend).
// Este ejemplo usa key/account (getWallet(account) -> Wallet signer) para firmar y enviar la tx.
async function buyProduct(productId, account){
  try {
    const walletSigner = getWallet(account); // tu helper que retorna ethers.Wallet o provider.getSigner()
    const tienda = getContract(WALLET_CONTRACT, contract.abi).connect(walletSigner);

    // puedes leer el producto por la mapping pública:
    const product = await tienda.products(productId); // ok porque mapping es public
    if (!product || product.id.toString() === "0") throw new Error("Producto no encontrado");
    if (!product.active) throw new Error("Producto no disponible");

    // msg.value debe ser EXACTAMENTE product.price
    const value = product.price; // BigNumber
    const tx = await tienda.buyProduct(productId, { value: value.toString() });
    const receipt = await tx.wait();

    return {
      success: true,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.error("buyProduct error:", error);
    throw error;
  }
}

async function updateProductController(id, name, description, priceInEth, stock, imageUrl, active, account) {
    try {
        const parsedPrice = ethers.utils.parseEther(priceInEth.toString())

        const receipt = await createTransaction(
            WALLET_CONTRACT,      // <<< Dirección correcta
            contract.abi,         // <<< ABI correcto
            "updateProduct",      // <<< Nombre del método
            [id, name, description, parsedPrice, stock, imageUrl, active],
            account               // <<< Owner/seller
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

// Eliminar producto
async function deleteProductController(id, account){
  return await createTransaction("deleteProduct", [id], account);
}

// getPurchasesByUser
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


module.exports = {
  getProducts,
  addProduct,
  buyProduct,
  updateProductController,
  deleteProductController,
  getPurchasesByUser,
  getWalletBalance
}
