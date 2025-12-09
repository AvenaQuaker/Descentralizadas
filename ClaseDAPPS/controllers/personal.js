require('dotenv').config({ path: require('find-config')('.env') });
const contract = require("../artifacts/contracts/Personal.sol/PersonalManager.json");
const { ethers } = require("ethers");

const {
    createTransaction,
    getContract
} = require("../utils/contractHelper");

const { PERSONAL_CONTRACT,WALLET_CONTRACT } = process.env;


// --------- GET INSTANCE ----------
function getInstance() {
    return getContract(PERSONAL_CONTRACT, contract.abi);
}


// --------- SEND TRANSACTION ----------
async function send(method, params, account) {
    return await createTransaction(PERSONAL_CONTRACT, contract.abi, method, params, account);
}



// ======================================================
// ===============  CREATE PERSON  ======================
// ======================================================

async function autoRegisterCustomer(wallet, account) {
    try {
        const result = await send("autoRegisterCustomer", [wallet], account);

        return {
            success: true,
            message: "Cliente Registrado Automaticamente",
            data: result
        };

    } catch (err) {
        return {
            success: false,
            message: err.toString()
        };
    }
}



// ======================================================
// ===============  LOGIN WEB3  =========================
// ======================================================

async function loginWithWallet(wallet) {
    const instance = getInstance()

    try {
        const data = await instance.getPersonByWallet(wallet)

        return {
            success: true,
            exists: true,
            person: {
                id: data.id.toString(),
                email: data.email,
                username: data.username,
                role: data.role,
                imageUrl: data.imageUrl,
                salary: data.salary.toString(),
                active: data.active,
                wallet: wallet,
                productos: data.productosComprados?.map(n => n.toString()) || []
            }
        }

    } catch (err) {
        return {
            success: false,
            exists: false,
            message: "Wallet not registered"
        }
    }
}



// ======================================================
// ===============  GET PERSON BY WALLET  ===============
// ======================================================

async function getPersonByWallet(wallet) {
    return await loginWithWallet(wallet);
}



// ======================================================
// ===============  UPDATE  ========================
// ======================================================

async function updateBasicData(id, email, username, imageUrl, account) {
    active =true;

    try {
        await send("updateUser", [id, email, username, imageUrl, active], account)

        return {
            success: true,
            message: "Basic data updated successfully",
            updated: { id, email, username, imageUrl }
        }

    } catch (err) {
        return { success: false, message: err.message }
    }
}


async function updateRole(id, newRole, account) {
    try {
        await send("updateRole", [id, newRole], account);

        return {
            success: true,
            message: "Role updated successfully",
            updated: { id, newRole }
        };

    } catch (err) {
        return { success: false, message: err.toString() };
    }
}



// ======================================================
// ===============  GET ALL PERSONS  ====================
// ======================================================

async function getAllPersons() {
    try {
        const instance = getInstance();

        const persons = await instance.getAllPersons();

        // Muy importante: convertir array de structs a objetos JS normales
        const list = persons.map(p => ({
            id: p.id.toString(),
            email: p.email,
            username: p.username,
            imageUrl: p.imageUrl,
            role: p.role.toString(),
            salary: p.salary.toString(),
            active: p.active,
            wallet: p.wallet
        }));

        return {
            success: true,
            persons: list
        };

    } catch (error) {
        return {
            success: false,
            message: error.toString()
        };
    }
}

async function getPurchases(wallet) {
    const tienda = getContract(WALLET_CONTRACT, contract.abi)
    return await tienda.getPurchasesByUser(wallet)
}

async function registerPurchase(wallet, purchaseId, productId, amountPaid) {
    try {
        const instance = getInstance();

        // ABI del contrato PersonalManager
        const personalManagerAbi = contract.abi;

        // Convertir el monto a BigNumber
        const parsedAmount = ethers.utils.parseEther(String(amountPaid));

        // Crear la transacción firmada por el admin (índice 1)
        const tx = await createTransaction(
            PERSONAL_CONTRACT,
            personalManagerAbi,
            "registerPurchase",
            [wallet, purchaseId, productId, parsedAmount],
            1
        );

        return { success: true, txHash: tx.transactionHash };

    } catch (err) {
        console.error("REGISTER ERROR:", err);
        return { success: false, message: err.toString() };
    }
}


// ======================================================

module.exports = {
    autoRegisterCustomer,
    loginWithWallet,
    getPersonByWallet,
    updateRole,
    getAllPersons,
    updateBasicData,
    getPurchases,
    registerPurchase
};
