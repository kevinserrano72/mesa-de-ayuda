import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const conectarDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Conexión exitosa a MongoDB");
  } catch (error) {
    console.error("❌ Error de conexión:", error);
    process.exit(1);
  }
};

export default conectarDB;