import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import conectarDB from "./src/config/db.js";

// Rutas
import authRoutes from "./src/routes/auth.js";
import solicitudesRoutes from "./src/routes/solicitudes.js";
import statsRoutes from "./src/routes/stats.js";

dotenv.config();

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Conectar base de datos
conectarDB();

// Rutas API
app.use("/api/auth", authRoutes);
app.use("/api/solicitudes", solicitudesRoutes);
app.use("/api/stats", statsRoutes);

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ mensaje: "Ruta no encontrada" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
