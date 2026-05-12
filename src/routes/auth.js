import { Router } from "express";
import jwt from "jsonwebtoken";
import Usuario from "../models/Usuario.js";

const router = Router();

router.post("/login", async (req, res) => {
  try {
    const email = (req.body?.email || "").trim().toLowerCase();
    const password = req.body?.password ?? "";

    if (!email) {
      return res.status(400).json({ success: false, message: "El correo es obligatorio." });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: "La contraseña es obligatoria." });
    }

    const usuario = await Usuario.findOne({ email }).select("+password");
    if (!usuario || !usuario.activo) {
      return res.status(401).json({
        success: false,
        message: "Credenciales incorrectas o usuario inactivo.",
      });
    }

    const ok = await usuario.comparePassword(password);
    if (!ok) {
      return res.status(401).json({ success: false, message: "Credenciales incorrectas." });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET no está definido en .env");
      return res.status(500).json({ success: false, message: "Error de configuración del servidor." });
    }

    const token = jwt.sign(
      { sub: usuario._id.toString(), rol: usuario.rol },
      secret,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      data: {
        token,
        usuario: {
          id: usuario._id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
        },
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Error al iniciar sesión." });
  }
});

export default router;
