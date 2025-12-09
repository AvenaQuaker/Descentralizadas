import express from "express";
const router = express.Router();
import { VerificarSesion } from "../middlewares/Auth.js";
import walletController from "../controllers/wallet.js";
import personalController from "../controllers/personal.js";

router.get("/",  (req, res) => {
    res.render("Login");
})
router.get("/Admin", VerificarSesion("Admin"),async (req, res) => {
    const products = await walletController.getProducts();
    res.render("cliente",{products: products});
});
router.get("/Manager", VerificarSesion("Manager"),async (req, res) => {
    const products = await walletController.getProducts();
    res.render("cliente",{products: products});
});
router.get("/Cliente", VerificarSesion("Cliente"),async (req, res) => {
    const products = await walletController.getProducts();
    res.render("cliente",{products: products});
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
    const wallet = req.session.user.wallet;
    const personId = req.session.user.id;

    const personData = await personalController.getPersonByWallet(wallet);
    const purchases = await personalController.getPurchasesByPerson(personId);
    const allProducts = await walletController.getProducts();

    const movies = purchases.map(p => {
        const product = allProducts.find(prod => Number(prod.id) === Number(p.productId));
        return {
            id: product.id,
            name: product.name,
            imageUrl: product.imageUrl,
            price: product.price,
            timestamp: p.timestamp
        };
    });

    const saldo = await walletController.getWalletBalance(wallet);

    res.render("perfil", {
        person: personData.person,
        saldo,
        movies
    });
});



export default router;
