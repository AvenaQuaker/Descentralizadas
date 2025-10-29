const express = require('express');
const router = express.Router();
const pagosController = require('../controllers/pagos');

router.post('/deposit', async (req, res) => {
    try {
        const { amount, account } = req.body;
        await pagosController.deposit(amount, account);
        res.json({ success: true, message: 'Deposit successful' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/release', async (req, res) => {
    try {
        const { account } = req.body;
        const receipt = await pagosController.release(account);
        res.json({ success: true, receipt });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/releaseAll', async (req, res) => {
    try {
    await pagosController.releaseAll();
    res.json({ success: true, message: "Todos los pagos liberados correctamente" });
    } catch (error) {
    res.status(500).json({ message: error.message });
    }
});

router.get('/balance', async (req, res) => {
    try {
        const balance = await pagosController.getBalance();
        res.json({ balance: balance.toString() });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;