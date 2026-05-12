import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import conectarDB from "./src/config/db.js";
import { requireAuth } from "./src/middleware/auth.js";
import authRoutes from "./src/routes/auth.js";
import solicitudesRoutes from "./src/routes/solicitudes.js";
import statsRoutes from "./src/routes/stats.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

app.use("/api/auth", authRoutes);
app.use("/api/solicitudes", requireAuth, solicitudesRoutes);
app.use("/api/stats", requireAuth, statsRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "OK" });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ success: false, message: "Error interno del servidor." });
});

await conectarDB();

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});
