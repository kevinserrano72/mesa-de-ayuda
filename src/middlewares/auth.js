import jwt from "jsonwebtoken";
import Usuario from "../models/Usuario.js";

const proteger = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ mensaje: "No autorizado, token requerido" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = await Usuario.findById(decoded.id).select("-password");

    if (!req.usuario || !req.usuario.activo) {
      return res
        .status(401)
        .json({ mensaje: "No autorizado, usuario inactivo o no encontrado" });
    }

    next();
  } catch (error) {
    return res.status(401).json({ mensaje: "Token inválido o expirado" });
  }
};

export default proteger;
