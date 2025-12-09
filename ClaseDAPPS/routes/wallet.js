const express = require("express");
const router = express.Router();
const {  getContract, createTransaction } = require("../utils/contractHelper.js");
const contract = require("../artifacts/contracts/Wallet.sol/MultiSignPaymentWallet.json");
const { WALLET_CONTRACT } = process.env;

const {
    getProducts,
    addProduct,
    updateProductController,
    deleteProductController,
    getPurchasesByUser
} = require("../controllers/wallet.js");

const personalController = require("../controllers/personal.js");

// ===============================
// GET: Productos
// ===============================
router.get("/products", async (req, res) => {
    try {
        const list = await getProducts();
        res.json({ success: true, products: list });
    } catch (err) {
        console.error("Error /products:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ===============================
// POST: Crear Producto
// ===============================
router.post("/products", async (req, res) => {
    const { name, description, price, stock, imageUrl } = req.body;
    
    const account = "0x1881520890eCD07b9a0CAc5E49fd34e5Dc8dA8f8"; // Admin

    try {
        const tx = await addProduct(name, description, price, stock, imageUrl, account);
        res.json({ success: true, transaction: tx });
    } catch (err) {
        console.error("Error creating product:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ===============================
// PUT: Actualizar producto
// ===============================
router.put("/products/:id", async (req, res) => {
    const { id } = req.params;
    const { name, description, price, stock, imageUrl, active } = req.body;

    const account = "0x1881520890eCD07b9a0CAc5E49fd34e5Dc8dA8f8"; // Admin

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

// ===============================
// DELETE: Borrar producto
// ===============================
router.delete("/products/:id", async (req, res) => {
    const { id } = req.params;
    const account = req.session?.user?.wallet;

    try {
        const tx = await deleteProductController(id, account);
        res.json({ success: true, transaction: tx });
    } catch (err) {
        console.error("Error deleting product:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ===============================
// GET: Compras del usuario
// ===============================
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

module.exports = router;
