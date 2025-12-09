export function VerificarSesion(rolRequerido = null) {
    return (req, res, next) => {
        if (!req.session.user) {
            return res.redirect("/");
        }

        if (rolRequerido && req.session.user.rol !== rolRequerido) {
            return res.status(403).send("Acceso denegado");
        }

        next();
    };
}