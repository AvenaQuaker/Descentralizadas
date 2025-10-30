require('dotenv').config({path: require('find-config')('.env')})
const { ethers } = require('ethers')
const { API_URL, PUBLIC_KEYS, PRIVATE_KEYS } = process.env

const publickeys =  PUBLIC_KEYS.split(',')
const privatekeys = PRIVATE_KEYS.split(',')
const provider = new ethers.providers.JsonRpcProvider(API_URL)

function getWallet(account) {
    if(account >= publickeys.length) throw new Error(`Account ${account} not found`)
    return new ethers.Wallet(privatekeys[account], provider)
}

function getPublicKey(account) {
    if(account >= publickeys.length) throw new Error(`Account ${account} not found`)
    return publickeys[account]
}

function getALLAcounts() {
    return publickeys.map((key, index) => ({
        publicKey: key,
        privateKey: privatekeys[index]
    }))
}
module.exports = {
    provider,
    getWallet,
    getPublicKey,
    getALLAcounts,
    publickeys
}