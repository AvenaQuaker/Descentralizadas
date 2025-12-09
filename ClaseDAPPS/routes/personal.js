const express = require("express")
const router = express.Router()
const personalController = require("../controllers/personal.js")


// ----------- CREATE ----------
router.post("/create", async (req, res) => {
    try {
        const { account, data } = req.body
        const result = await personalController.createPerson(data, account)
        res.json(result)
    } catch (err) {
        console.error(err)
        res.status(500).json({ success: false, message: err.message })
    }
})


// ----------- LOGIN POR WALLET PUBLICA ----------
router.post("/loginWallet", async (req, res) => {
    try {
        const { wallet } = req.body
        const result = await personalController.loginWithWallet(wallet)
        res.json(result)
    } catch (err) {
        console.error(err)
        res.status(500).json({ success: false, message: err.message })
    }
})


// ----------- GET USER BY WALLET ----------
router.get("/byWallet/:wallet", async (req, res) => {
    try {
        const wallet = req.params.wallet
        const result = await personalController.getPersonByWallet(wallet)
        res.json(result)
    } catch (err) {
        console.error(err)
        res.status(500).json({ success: false, message: err.message })
    }
})

router.post("/registerPurchase", async (req, res) => {
    try {
        const { wallet, productId, amountPaid } = req.body;

        const purchaseId = Date.now();

        const result = await personalController.registerPurchase(
            wallet,
            purchaseId,
            productId,
            amountPaid
        );

        return res.json(result);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: err.message });
    }
});


// ----------- UPDATE ROLE ----------
router.post("/updateRole", async (req, res) => {
    try {
        const { id, newRole, account } = req.body
        const result = await personalController.updateRole(id, newRole, account)
        res.json(result)
    } catch (err) {
        res.status(500).json({ success: false, message: err.message })
    }
})


// ----------- UPDATE SALARY ----------
router.post("/updateSalary", async (req, res) => {
    try {
        const { id, newSalary, account } = req.body
        const result = await personalController.updateSalary(id, newSalary, account)
        res.json(result)
    } catch (err) {
        res.status(500).json({ success: false, message: err.message })
    }
})


// ----------- SET ACTIVE ----------
router.post("/setActive", async (req, res) => {
    try {
        const { id, active, account } = req.body
        const result = await personalController.setActive(id, active, account)
        res.json(result)
    } catch (err) {
        res.status(500).json({ success: false, message: err.message })
    }
})


// ----------- UPDATE BASIC DATA ----------
router.post("/updateBasic", async (req, res) => {
    try {
        const { id, email, username, imageUrl, account } = req.body
        const result = await personalController.updateBasicData(id, email, username, imageUrl, account)
        res.json(result)
    } catch (err) {
        res.status(500).json({ success: false, message: err.message })
    }
})


// ----------- GET ALL ----------
router.get("/getAll", async (req, res) => {
    console.log("entro")

    try {
        const persons = await personalController.getAllPersons()
        res.json({ success: true, persons })
    } catch (err) {
        res.status(500).json({ success: false, message: err.message })
    }
})

module.exports = router
