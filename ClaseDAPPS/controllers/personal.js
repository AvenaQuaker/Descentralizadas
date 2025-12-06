require('dotenv').config({ path: require('find-config')('.env') })
const { ethers } = require("ethers")
const contract = require("../artifacts/contracts/Personal.sol/PersonalManager.json")
const { parseEthersError } = require("../utils/parseEthersError");

const {
    createTransaction,
    getContract
} = require("../utils/contractHelper")

const { PERSONAL_CONTRACT } = process.env


// --------- HELPERS ----------
function getInstance() {
    return getContract(PERSONAL_CONTRACT, contract.abi)
}

async function send(method, params, account) {
    return await createTransaction(PERSONAL_CONTRACT, contract.abi, method, params, account)
}


// --------- CREATE PERSON ----------
async function createPerson(data, account) {
    try {
        const { email, password, username, role, imageUrl, salary, wallet } = data

        await send("createPerson", [
            email,
            password,
            username,
            role,
            imageUrl,
            salary,
            wallet
        ], account)

        return {
            success: true,
            message: "Person created successfully",
            created: { email, username, role, wallet }
        }

    } catch (err) {
        return { success: false, message: parseEthersError(err) }
    }
}


// --------- LOGIN POR WALLET (SIN PASSWORD) ----------
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
                wallet: wallet
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


// ---------- GET PERSON BY WALLET ----------
async function getPersonByWallet(wallet) {
    return await loginWithWallet(wallet)
}


// --------- UPDATE ROLE ----------
async function updateRole(id, newRole, account) {
    try {
        await send("updateRole", [id, newRole], account)

        return {
            success: true,
            message: "Role updated successfully",
            updated: { id, newRole }
        }

    } catch (err) {
        return { success: false, message: parseEthersError(err) }
    }
}


// --------- UPDATE SALARY ----------
async function updateSalary(id, newSalary, account) {
    try {
        await send("updateSalary", [id, newSalary], account)

        return {
            success: true,
            message: "Salary updated successfully",
            updated: { id, newSalary }
        }

    } catch (err) {
        return { success: false, message: parseEthersError(err) }
    }
}


// --------- SET ACTIVE ----------
async function setActive(id, active, account) {
    try {
        await send("setActive", [id, active], account)

        return {
            success: true,
            message: "User status updated",
            updated: { id, active }
        }

    } catch (err) {
        return { success: false, message: parseEthersError(err) }
    }
}


// --------- UPDATE BASIC ----------
async function updateBasicData(id, email, username, imageUrl, account) {
    try {
        await send("updateBasicData", [id, email, username, imageUrl], account)

        return {
            success: true,
            message: "Basic data updated successfully",
            updated: { id, email, username, imageUrl }
        }

    } catch (err) {
        return { success: false, message: parseEthersError(err) }
    }
}


// --------- GET ALL PERSONS ----------
async function getAllPersons() {
    try {
        const instance = getInstance()
        const list = await instance.getAllPersons()

        const formatted = list
            .filter(p => p.id.toString() !== "0")
            .map(p => ({
                id: p.id.toString(),
                email: p.email,
                username: p.username,
                role: p.role,
                salary: p.salary.toString(),
                imageUrl: p.imageUrl,
                active: p.active,
                wallet: p.wallet
            }))

        return {
            success: true,
            persons: formatted
        }

    } catch (err) {
        return { success: false, message: parseEthersError(err) }
    }
}


module.exports = {
    createPerson,
    loginWithWallet,
    getPersonByWallet,
    updateRole,
    updateSalary,
    setActive,
    updateBasicData,
    getAllPersons
}
