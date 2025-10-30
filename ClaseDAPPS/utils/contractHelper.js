const { ethers } = require("ethers")
const { provider, getWallet, getPublicKey } = require("./accountManager")

async function createTransaction(contractAddress, abi, method, params, account) {
    try {
        const wallet = getWallet(account)
        const contract = new ethers.Contract(contractAddress, abi, wallet)
        
        // Llamada al método del contrato
        const tx = await contract[method](...params)
        const receipt = await tx.wait()
        
        console.log(`Transaction hash: ${receipt.transactionHash}`)
        return receipt
    } catch (error) {
        console.error(`Error en createTransaction: ${error.message}`)
        throw error
    }
}

async function depositToContract(contractAddress, abi, amount, account) {
    try {
        const wallet = getWallet(account)
        const contract = new ethers.Contract(contractAddress, abi, wallet)
        
        const tx = await contract.deposit({ value: ethers.utils.parseEther(amount) })
        const receipt = await tx.wait()
        
        console.log(`Deposit Transaction hash: ${receipt.transactionHash}`)
        return receipt
    } catch (error) {
        console.error(`Error en depositToContract: ${error.message}`)
        throw error
    }
}

function getContract(contractAddress, abi) {
    return new ethers.Contract(contractAddress, abi, provider)
}

async function getPayeeBalance(account) {
    try {
        const balance = await provider.getBalance(account)
        return balance
    } catch (error) {
        console.error("Error getting payee balance:", error)
        throw error
    }
}

async function updateProduct(contractAddress, abi, productId, newName, newPrice, account) {
    const priceInWei = ethers.utils.parseEther(newPrice.toString())
    return await createTransaction(contractAddress, abi, "updateProduct", [productId, newName, priceInWei], account)
}

async function setProductActive(contractAddress, abi, productId, active, account) {
    return await createTransaction(contractAddress, abi, "setProductActive", [productId, active], account)
}

async function releaseToPayee(contractAddress, abi, payee, amount, account) {
    const amountInWei = ethers.utils.parseEther(amount.toString())
    return await createTransaction(contractAddress, abi, "releaseToPayee", [payee, amountInWei], account)
}

module.exports = {
    createTransaction,
    depositToContract,
    getContract,
    getPayeeBalance,
    updateProduct,
    setProductActive,
    releaseToPayee
}