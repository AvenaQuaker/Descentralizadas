require('dotenv').config({ path: require('find-config')('.env') });
const { ethers } = require('ethers');

const { API_URL, PRIVATE_KEY } = process.env;

if (!API_URL) throw new Error("Falta API_URL en el .env");
if (!PRIVATE_KEY) throw new Error("Falta PRIVATE_KEY en el .env");

const provider = new ethers.providers.JsonRpcProvider(API_URL);
const adminWallet = new ethers.Wallet(PRIVATE_KEY, provider);

function getWallet() {
    return adminWallet; 
}

function getPublicKey() {
    return adminWallet.address;
}

module.exports = {
    provider,
    getWallet,
    getPublicKey,
};
