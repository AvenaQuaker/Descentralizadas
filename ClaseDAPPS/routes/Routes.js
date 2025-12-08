import express from "express";
const router = express.Router();
import { VerificarSesion } from "../middlewares/Auth.js";
import walletController from "../controllers/wallet.js";

router.get("/",  (req, res) => {
    res.render("Login");
})
router.get("/admin", VerificarSesion("admin"),(req, res) => {
    res.render("admin");
});
router.get("/manager", VerificarSesion("manager"),(req, res) => {
    res.render("manager");
});
router.get("/cliente", VerificarSesion("cliente"),async (req, res) => {
    const products = await walletController.getProducts();
    res.render("cliente",{products: products});
});

router.post("/login", (req, res) => {
    const { usuario, password } = req.body;

    const personal = [
        { usuario: "admin", password: "ABC", rol: "admin" },
        { usuario: "manager", password: "123", rol: "manager" },
        { usuario: "cliente", password: "sonic", rol: "cliente" }
    ];

    const user = personal.find(u => u.usuario === usuario && u.password === password);

    if (!user) {
        return res.status(400).json({ error: "Credenciales incorrectas" });
    }

    req.session.user = {
        usuario: user.usuario,
        rol: user.rol
    };

    // Responde JSON, no render
    if (user.rol === "admin") return res.json({ message: "ok", redirect: "/admin" });
    if (user.rol === "manager") return res.json({ message: "ok", redirect: "/manager" });
    if (user.rol === "cliente") return res.json({ message: "ok", redirect: "/cliente" });
});



export default router;
