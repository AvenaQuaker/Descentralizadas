require('dotenv').config({ path: require('find-config')('.env') })
const fs = require('fs')
const FormData = require('form-data')
const axios = require('axios')
const { ethers } = require('ethers')
const contract = require('../artifacts/contracts/NFT.sol/NFTClase.json')
const {
    PINATA_API_KEY,
    PINATA_API_SECRET,
    NFT_CONTRACT_ADDRESS,
    PUBLIC_KEY,
    PRIVATE_KEY,
    API_URL
} = process.env

async function createImageInfo(imageRoute) {
    const stream = fs.createReadStream(imageRoute)
    const data = new FormData()
    data.append('file', stream)
    const fileResponse = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", data, {
        headers: {
            ...data.getHeaders(),
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_API_SECRET
        }
    })
    const { data: fileData = {} } = fileResponse
    const { IpfsHash } = fileData
    const fileIPFS = `https://gateway.pinata.cloud/ipfs/${IpfsHash}`
    return fileIPFS
}

async function createJsonInfo(metadata) {
    const pinataJSONBody = {
        pinataContent: metadata
    }
    const jsonResponse = await axios.post(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        pinataJSONBody,
        {
            headers: {
                "Content-Type": 'application/json',
                pinata_api_key: PINATA_API_KEY,
                pinata_secret_api_key: PINATA_API_SECRET
            }
        }
    )
    const { data: jsonData = {} } = jsonResponse
    const { IpfsHash } = jsonData
    const tokenURI = `https://gateway.pinata.cloud/ipfs/${IpfsHash}`
    return tokenURI
}

async function createNFT() {
    const imgInfo = await createImageInfo('images/Imagen10.jpg')
    const metadata = {
        image: imgInfo,
        name: 'imagen10.jpg',
        description: "7erNFT",
        attributes: [{
            'trait_type': 'color',
            value: 'white'
        }, {
            'trait_type': 'background',
            value: 'white'
        }]
    }
    const tokenURI = await createJsonInfo(metadata)
    const nftResult = await mintNFT(tokenURI)
    console.log(nftResult)
    return nftResult
}

async function mintNFT(tokenURI) {
    const provider = new ethers.providers.JsonRpcProvider(API_URL)
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider)
    const etherInterface = new ethers.utils.Interface(contract.abi)
    const nonce = await provider.getTransactionCount(PUBLIC_KEY, 'latest')
    const network = await provider.getNetwork()
    const gasPrice = await provider.getGasPrice()
    const { chainId } = network
    const transaction = {
        from: PUBLIC_KEY,
        to: NFT_CONTRACT_ADDRESS,
        nonce,
        chainId,
        gasPrice,
        data: etherInterface.encodeFunctionData("mintNFT", [PUBLIC_KEY, tokenURI])
    }
    console.log(transaction)
    const estimateGas = await provider.estimateGas(transaction)
    transaction.gasLimit = estimateGas
    const signedTr = await wallet.signTransaction(transaction)
    const result = await provider.sendTransaction(signedTr)
    await result.wait()
    const hash = result.hash;
    const receipt = await provider.getTransactionReceipt(hash);

    // Buscar evento Transfer (de ERC721)
    const iface = new ethers.utils.Interface(contract.abi);
    let tokenId = null;

    for (const log of receipt.logs) {
    try {
        const parsed = iface.parseLog(log);
        if (parsed.name === "Transfer") {
        tokenId = parsed.args.tokenId.toString();
        break;
        }
    } catch (err) {
        // El log no pertenece a este contrato
    }
    }

    if (tokenId) {
    console.log("✅ NFT TOKEN ID:", tokenId);
    } else {
    console.warn("⚠️ No se encontró evento Transfer, revisa el receipt:");
    console.log(receipt);
    }

    return hash;

}

createNFT().catch(console.error)