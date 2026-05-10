import { Router } from "express";
import jwt from "jsonwebtoken";
import Usuario from "../models/Usuario.js";
import proteger from "../middlewares/auth.js";

const router = Router();

// Generar token JWT
const generarToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "8h",
  });

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ mensaje: "Email y contraseña son requeridos" });
    }

    const usuario = await Usuario.findOne({ email, activo: true });
    if (!usuario) {
      return res.status(401).json({ mensaje: "Credenciales inválidas" });
    }

    const passwordValido = await usuario.compararPassword(password);
    if (!passwordValido) {
      return res.status(401).json({ mensaje: "Credenciales inválidas" });
    }

    // Actualizar último acceso
    usuario.ultimoAcceso = new Date();
    await usuario.save({ validateBeforeSave: false });

    res.json({
      token: generarToken(usuario._id),
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error en el servidor" });
  }
});

// POST /api/auth/registro  (crear primer administrador)
router.post("/registro", async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
      return res
        .status(400)
        .json({ mensaje: "Nombre, email y contraseña son requeridos" });
    }

    const existe = await Usuario.findOne({ email });
    if (existe) {
      return res.status(400).json({ mensaje: "El email ya está registrado" });
    }

    const usuario = await Usuario.create({ nombre, email, password });

    res.status(201).json({
      token: generarToken(usuario._id),
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error en el servidor" });
  }
});

// GET /api/auth/perfil  (ruta protegida de prueba)
router.get("/perfil", proteger, async (req, res) => {
  res.json({ usuario: req.usuario });
});

export default router;
