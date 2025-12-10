const express = require("express");
const router = express.Router();
const contract = require("../artifacts/contracts/Wallet.sol/MultiSignPaymentWallet.json");
const { OWNER } = process.env;

const {
    getProducts,
    addProduct,
    updateProductController,
    deleteProductController,
    getPurchasesByUser,
    totalBalance,
    PagarAlOwner
} = require("../controllers/wallet.js");
const personalController = require("../controllers/personal.js");

router.get("/products", async (req, res) => {
    try {
        const list = await getProducts();
        res.json({ success: true, products: list });
    } catch (err) {
        console.error("Error /products:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post("/products", async (req, res) => {
    const { name, description, price, stock, imageUrl } = req.body;
    
    const account = OWNER;

    try {
        const tx = await addProduct(name, description, price, stock, imageUrl, account);
        res.json({ success: true, transaction: tx });
    } catch (err) {
        console.error("Error creating product:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

router.put("/products/:id", async (req, res) => {
    const { id } = req.params;
    const { name, description, price, stock, imageUrl, active } = req.body;

    const account = OWNER;

    try {
        const result = await updateProductController(
            id, name, description, price, stock, imageUrl, active, account
        );

        res.json({ success: true, message: "Producto actualizado" });

    } catch (err) {
        console.error("Error updating product:", err);
        res.status(400).json({ error: err.message });
    }
});

router.delete("/products/:id", async (req, res) => {
    const { id } = req.params;
    
    const account = OWNER;

    if (!account) {
        return res.status(401).json({ success: false, error: "Not logged in" });
    }

    try {
        const tx = await deleteProductController(id, account);

        return res.json({
            success: true,
            tx
        });

    } catch (err) {
        console.error("Error deleting product:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

router.get("/purchases", async (req, res) => {
    const account = req.session?.user?.wallet;

    if (!account)
        return res.status(401).json({ success: false, error: "Debes iniciar sesión" });

    try {
        const list = await getPurchasesByUser(account);
        res.json({ success: true, purchases: list });

    } catch (err) {
        console.error("Error get purchases:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get("/balance", async (req, res) => {
    try {
        const balance = await totalBalance()
        return res.json({ success: true, balance })
    } catch (err) {
        console.error("Error /api/wallet/balance:", err)
        return res.status(500).json({ success: false, message: err.message })
    }
})

router.post("/withdraw", async (req, res) => {
    try {
        const { amount } = req.body 

        if (!amount || Number(amount) <= 0) {
            return res.status(400).json({ success: false, message: "Cantidad inválida" })
        }

        const result = await PagarAlOwner(amount)

        if (!result.success) {
            return res.status(400).json(result)
        }

        return res.json(result)

    } catch (err) {
        console.error("Error /api/wallet/withdraw:", err)
        return res.status(500).json({ success: false, message: err.message })
    }
})

module.exports = router;
