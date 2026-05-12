/**
 * Restablece la contraseña del usuario admin@empresa.com sin borrar solicitudes.
 * Uso: npm run reset-admin
 */
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import mongoose from "mongoose";
import Usuario from "../models/Usuario.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, "../../.env") });

const EMAIL = "admin@empresa.com";
const NEW_PASSWORD = "Admin123!";

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error("Falta MONGODB_URI en .env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const usuario = await Usuario.findOne({ email: EMAIL }).select("+password");

  if (!usuario) {
    await Usuario.create({
      nombre: "Administrador",
      email: EMAIL,
      password: NEW_PASSWORD,
      rol: "administrador",
      activo: true,
    });
    console.log(`Usuario creado: ${EMAIL} / ${NEW_PASSWORD}`);
  } else {
    usuario.password = NEW_PASSWORD;
    usuario.activo = true;
    await usuario.save();
    console.log(`Contraseña actualizada: ${EMAIL} / ${NEW_PASSWORD}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
