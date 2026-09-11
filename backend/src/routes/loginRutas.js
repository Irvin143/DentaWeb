import { Router } from "express";
import jwt from "jsonwebtoken";
import * as loginService from "../services/loginServices.js";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRACION = "7d";

router.post('/', async (req, res) => {
    const { email, password } = req.body;

    const resultado = await loginService.verificarCredenciales(email, password);

    if (!resultado.success) {
        res.status(401).send({ success: false, error: resultado.error });
        return;
    }

    const token = jwt.sign(
        { id: resultado.cliente.id, email: resultado.cliente.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRACION }
    );

    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.send({ success: true, cliente: resultado.cliente });
});

router.post('/logout', (_req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });

    res.send({ success: true });
});

export default router;