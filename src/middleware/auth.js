import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No autorizado." });
  }
  try {
    const token = header.slice(7);
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET no está definido en .env");
      return res.status(500).json({ success: false, message: "Error de configuración del servidor." });
    }
    const decoded = jwt.verify(token, secret);
    req.userId = decoded.sub;
    req.userRol = decoded.rol;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Sesión inválida o expirada." });
  }
}
