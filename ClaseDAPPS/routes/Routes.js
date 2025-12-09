import express from "express";
const router = express.Router();
import { VerificarSesion } from "../middlewares/Auth.js";
import walletController from "../controllers/wallet.js";
import personalController from "../controllers/personal.js";
const { WALLET_CONTRACT } = process.env

router.get("/",  (req, res) => {
    res.render("Login");
})

router.post("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error("Error al cerrar sesión:", err);
            return res.status(500).send("Error al cerrar sesión");
        }
        res.redirect("/");
    });
});

router.get("/Admin", VerificarSesion("Admin"), async (req, res) => {
    try {
        const products = await walletController.getProducts();
        const role = req.session.user.rol;

        res.render("cliente", {
            products,
            role,
            walletContract: WALLET_CONTRACT
        });
    } catch (err) {
        console.error("Error al cargar /Admin:", err);
        res.status(500).send("Error cargando la tienda");
    }
});

router.get("/Manager", VerificarSesion("Manager"), async (req, res) => {
    try {
        const products = await walletController.getProducts();
        const role = req.session.user.rol;

        res.render("cliente", {
            products,
            role,
            walletContract: WALLET_CONTRACT
        });
    } catch (err) {
        console.error("Error al cargar /Manager:", err);
        res.status(500).send("Error cargando la tienda");
    }
});

router.get("/Cliente", VerificarSesion("Cliente"), async (req, res) => {
    try {
        const products = await walletController.getProducts();
        const role = req.session.user.rol;

        res.render("cliente", {
            products,
            role,
            walletContract: WALLET_CONTRACT
        });
    } catch (err) {
        console.error("Error al cargar /Cliente:", err);
        res.status(500).send("Error cargando la tienda");
    }
});


router.post("/login", async (req, res) => {
    const { wallet } = req.body;

    const result = await personalController.loginWithWallet(wallet);
    
    if (!result.success) {
        try {
            personalController.autoRegisterCustomer(wallet, 0);

            return res.json({
                message: "Cuenta creada automáticamente. Inicia sesión.",
                redirect: "/"
            });

        } catch (err) {
            return res.json({
                message: "Error al crear cuenta",
                err,
                redirect: "/"
            });
        }
    }

    const person = result.person;

    const roleMap = {
        0: "None",
        1: "Admin",
        2: "Manager",
        3: "Cliente"
    };

    person.role = roleMap[person.role];

    req.session.user = {
        usuario: person.username,
        rol: person.role,
        wallet: person.wallet,
        id: person.id
    };

    return res.json({
        message: "ok",
        redirect: `/${person.role}`
    });
});

router.get("/perfil", VerificarSesion(), async (req, res) => {
    try {
        const wallet = req.session.user.wallet;

        // === 1. INFO DEL USUARIO ===
        const personData = await personalController.getPersonByWallet(wallet);

        if (!personData.success) {
            return res.status(400).send("Usuario no encontrado en el contrato");
        }

        // === 2. SALDO DEL USUARIO ===
        const saldo = await walletController.getWalletBalance(wallet);

        // === 3. COMPRAS DEL USUARIO (desde contrato de tienda) ===
        const purchases = await walletController.getPurchasesByUser(wallet);

        // === 4. PRODUCTOS DISPONIBLES ===
        const allProducts = await walletController.getProducts();

        // === 5. UNIR COMPRAS + PRODUCTOS ===
        const movies = purchases.map(p => {
            const product = allProducts.find(prod => Number(prod.id) === Number(p.productId));

            if (!product) {
                return {
                    id: p.productId,
                    name: "Producto eliminado",
                    imageUrl: "https://via.placeholder.com/200?text=Producto+Eliminado",
                    price: "0",
                    timestamp: p.timestamp
                };
            }

            return {
                id: product.id,
                name: product.name,
                imageUrl: product.imageUrl,
                price: product.price,
                timestamp: p.timestamp
            };
        });

        // === 6. RENDERIZAR PERFIL ===
        res.render("perfil", {
            person: personData.person,
            saldo,
            movies
        });

    } catch (err) {
        console.error("Error en perfil:", err);
        res.status(500).send("Error interno del servidor");
    }
});




export default router;
