export function VerificarSesion(rol) {
    return (req, res, next) => {
        if (!req.session.user || req.session.user.rol !== rol) {
            return res.redirect("/");
        }
        next();
    };
}
