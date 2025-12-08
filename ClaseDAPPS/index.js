import express from "express";
import session from "express-session";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Routes from "./routes/Routes.js";
import walletRoutes from "./routes/wallet.js";
import pagosRoutes from "./routes/pagos.js";


dotenv.config();

const app = express();

// Obtener dirname correctamente
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares básicos
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// Configurar carpeta pública
app.use(express.static(path.join(__dirname, "./public")));
app.use('/sweetalert2', express.static('./node_modules/sweetalert2/dist'));

// Configurar EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "./views"));

// Configurar sesiones
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret123",
    resave: false,
    saveUninitialized: false,
  })
);

// Rutas
app.use("/", Routes);
app.use("/api/wallet", walletRoutes);
app.use("/api/pagos", pagosRoutes);

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server at port http://localhost:${PORT}`));
