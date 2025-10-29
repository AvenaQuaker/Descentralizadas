const {ethers} = require("ethers");
const { provider, getWallet, getPublicKey} = require("./accountManager");

async function createTransaction(contractAdress,abi,method,params,account){
    console.log(account)
    const etherInterface = new ethers.utils.Interface(abi);
    const data = etherInterface.encodeFunctionData(method, params);
    const wallet = getWallet(account);
    const publickeys = getPublicKey(account);
    const nonce = await provider.getTransactionCount(getPublicKey(account), 'latest');
    const gasPrice = await provider.getGasPrice();
    const network = await provider.getNetwork();
    const { chainId } = network;
    const transaction = {
        gasPrice:gasPrice,
        from: publickeys,
        to: contractAdress,
        nonce:nonce,
        chainId: chainId,
        data:data,
    }
    console.log(transaction)
    transaction.gasLimit = await provider.estimateGas(transaction);
    const signTransaction = await wallet.signTransaction(transaction);
    const receipt = await provider.sendTransaction(signTransaction);
    await receipt.wait();
    console.log(`Transaction hash: ${receipt.hash}`);
    return receipt;
}

async function depositToContract(contractAdress,abi,amount,account){
    const wallet = getWallet(account)
    const contract = new ethers.Contract(contractAdress,abi,wallet)
    const transaction = contract.deposit({value: ethers.utils.parseEther(amount)});
    const tx = await transaction;
    console.log(`Transaction hash: ${tx.hash}`);
    return tx;
}
function getContract(contractAdress,abi){
    return new ethers.Contract(contractAdress,abi,provider)
}
module.exports = {createTransaction,depositToContract,getContract}