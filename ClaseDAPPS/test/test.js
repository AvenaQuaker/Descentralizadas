const { ethers } = require("ethers");
const walletController = require("../controllers/wallet");
const { publickeys } = require("../utils/accountManager");
require("dotenv").config();

async function main() {
    const account1 = 0; 
    const account2 = 1; 

    console.log("=== INICIO DE PRUEBAS ===");

    // 1️⃣ Deposit
    console.log("Depositando 0.005 ETH...");
    await walletController.deposit("0.005", account1);
    console.log("Deposit hecho ✅");

    // 2️⃣ Submit Transaction
    console.log(`Creando transacción a account2 (${publickeys[account2]}) 0.002 ETH...`);
    const txSubmit = await walletController.submitTransaction(publickeys[account2], ethers.utils.parseEther("0.002"), account1);
    console.log("Transacción creada ✅", txSubmit.hash);

    // 3️⃣ Approve Transaction (multi-sign)
    console.log("Aprobando transacción con account2...");
    await walletController.approveTransaction(0, account2);
    console.log("Transacción aprobada ✅");

    // 3️⃣ Approve Transaction (multi-sign)
    console.log("Aprobando transacción con account1...");
    await walletController.approveTransaction(0, account1);
    console.log("Transacción aprobada ✅");

    // 4️⃣ Execute Transaction
    console.log("Ejecutando transacción...");
    await walletController.executeTransaction(0, account1);
    console.log("Transacción ejecutada ✅");

    // 6️⃣ Release To Payee específico
    console.log(`Liberando 0.001 ETH a account2 (${publickeys[account2]})...`);
    await walletController.releaseToPayeeController(publickeys[account2], "0.001", account1);
    console.log("Pago liberado a payee ✅");

    // 5️⃣ Release Payments (payees)
    console.log("Liberando fondos a payees...");
    await walletController.releasePayments(account1);
    console.log("Pagos liberados ✅");
    
    // --- Flujos de Productos ---

    // 1️⃣ Add Product
    console.log("Agregando producto 'Laptop' 0.0005 ETH...");
    await walletController.addProduct("Laptop", ethers.utils.parseEther("0.0005"), account1);
    console.log("Producto agregado ✅");

    // 2️⃣ Get Products
    const products = await walletController.getProducts();
    console.log("Productos actuales:", products);

    // 3️⃣ Buy Product
    console.log("Comprando producto 0...");
    await walletController.buyProduct(0, account2);
    console.log("Producto comprado ✅");

    // 4️⃣ Update Product
    console.log("Actualizando producto 0 a 'Laptop Pro' 0.0025 ETH...");
    await walletController.updateProductController(0, "Laptop Pro", "0.0025", account1);
    console.log("Producto actualizado ✅");

    // 5️⃣ Disable Product
    console.log("Desactivando producto 0...");
    await walletController.setProductActiveController(0, false, account1);
    console.log("Producto desactivado ✅");

    // 2️⃣ Get Products
    const updatedProducts = await walletController.getProducts();
    console.log("Productos actualizados:", updatedProducts);

    // --- Validaciones ---
    await walletController.getBalance();

    const transactions = await walletController.getTransactions();
    console.log("Transacciones:", transactions);

    const payeeBalance = await walletController.payeeBalance(publickeys[account1]);
    console.log(`Balance de payee ${publickeys[account1]}:`, payeeBalance);

    console.log("=== PRUEBAS COMPLETAS ✅ ===");
}

main()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
