// seed.mjs - ejecutar con: node seed.mjs
import { createRequire } from "module";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Leer .env manualmente
const envPath = resolve(__dirname, ".env");
const envContent = readFileSync(envPath, "utf8");
envContent.split("\n").forEach((line) => {
  const [key, ...rest] = line.split("=");
  if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
});

console.log("MONGODB_URI:", process.env.MONGODB_URI ? "OK" : "NO ENCONTRADA");

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("ERROR: MONGODB_URI no definida");
  process.exit(1);
}

console.log("Conectando a MongoDB...");

try {
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Conectado a MongoDB Atlas");

  const db = mongoose.connection.db;

  // Limpiar colecciones
  const colecciones = await db.listCollections().toArray();
  for (const col of colecciones) {
    await db.collection(col.name).drop();
    console.log(`🗑️  Colección eliminada: ${col.name}`);
  }

  // Crear usuario admin con password hasheado
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("Admin1234", salt);

  const ahora = new Date();

  const adminId = new mongoose.Types.ObjectId();

  // Insertar usuario
  await db.collection("usuarios").insertOne({
    _id: adminId,
    email: "admin@empresa.com",
    password: passwordHash,
    nombre: "Administrador",
    rol: "administrador",
    activo: true,
    createdAt: ahora,
    updatedAt: ahora,
  });
  console.log("👤 Usuario admin creado: admin@empresa.com / Admin1234");

  // Insertar contador
  await db.collection("contadores").insertOne({ _id: "solicitudes", seq: 5 });
  console.log("🔢 Contador inicializado en 5");

  // Insertar solicitudes
  const solicitudes = [
    {
      codigo: "SOL-001",
      titulo: "Computador no enciende",
      descripcion: "El equipo del área de contabilidad no enciende desde esta mañana.",
      tipo: "Incidente",
      prioridad: "Alta",
      estado: "Registrada",
      solicitante: { nombre: "Juan Pérez", email: "juan@empresa.com", telefono: "555-1001" },
      responsable: null,
      creadoPor: adminId,
      fechaRegistro: ahora,
      fechaActualizacion: ahora,
      activo: true,
      historialEstados: [{ estadoAnterior: null, estadoNuevo: "Registrada", fecha: ahora, observaciones: "Solicitud creada", usuarioId: adminId }],
      observaciones: [],
    },
    {
      codigo: "SOL-002",
      titulo: "Instalación de software contable",
      descripcion: "Se requiere instalar ContaPlus en 3 equipos del área financiera.",
      tipo: "Requerimiento",
      prioridad: "Media",
      estado: "En Proceso",
      solicitante: { nombre: "María López", email: "maria@empresa.com", telefono: "555-1002" },
      responsable: adminId,
      creadoPor: adminId,
      fechaRegistro: ahora,
      fechaActualizacion: ahora,
      activo: true,
      historialEstados: [
        { estadoAnterior: null, estadoNuevo: "Registrada", fecha: ahora, observaciones: "Solicitud creada", usuarioId: adminId },
        { estadoAnterior: "Registrada", estadoNuevo: "En Proceso", fecha: ahora, observaciones: "Asignada al técnico", usuarioId: adminId },
      ],
      observaciones: [],
    },
    {
      codigo: "SOL-003",
      titulo: "¿Cómo acceder al correo desde casa?",
      descripcion: "Necesito configurar el correo corporativo en mi celular personal.",
      tipo: "Consulta",
      prioridad: "Baja",
      estado: "Resuelta",
      solicitante: { nombre: "Carlos Ruiz", email: "carlos@empresa.com" },
      responsable: adminId,
      creadoPor: adminId,
      fechaRegistro: ahora,
      fechaActualizacion: ahora,
      fechaCierre: ahora,
      activo: true,
      historialEstados: [
        { estadoAnterior: null, estadoNuevo: "Registrada", fecha: ahora, observaciones: "Solicitud creada", usuarioId: adminId },
        { estadoAnterior: "Registrada", estadoNuevo: "Resuelta", fecha: ahora, observaciones: "Se envió guía por email", usuarioId: adminId },
      ],
      observaciones: [{ texto: "Se envió documentación al usuario", fecha: ahora, usuarioId: adminId }],
    },
    {
      codigo: "SOL-004",
      titulo: "Internet muy lento en sala de reuniones",
      descripcion: "La conexión WiFi en la sala de reuniones principal es muy inestable.",
      tipo: "Incidente",
      prioridad: "Critica",
      estado: "En Proceso",
      solicitante: { nombre: "Ana Torres", email: "ana@empresa.com", telefono: "555-1004" },
      responsable: adminId,
      creadoPor: adminId,
      fechaRegistro: ahora,
      fechaActualizacion: ahora,
      activo: true,
      historialEstados: [
        { estadoAnterior: null, estadoNuevo: "Registrada", fecha: ahora, observaciones: "Solicitud creada", usuarioId: adminId },
        { estadoAnterior: "Registrada", estadoNuevo: "En Proceso", fecha: ahora, observaciones: "Revisando infraestructura de red", usuarioId: adminId },
      ],
      observaciones: [],
    },
    {
      codigo: "SOL-005",
      titulo: "Solicitud de nuevo monitor",
      descripcion: "El monitor del puesto 12 tiene líneas horizontales.",
      tipo: "Requerimiento",
      prioridad: "Media",
      estado: "Registrada",
      solicitante: { nombre: "Pedro Gómez", email: "pedro@empresa.com" },
      responsable: null,
      creadoPor: adminId,
      fechaRegistro: ahora,
      fechaActualizacion: ahora,
      activo: true,
      historialEstados: [{ estadoAnterior: null, estadoNuevo: "Registrada", fecha: ahora, observaciones: "Solicitud creada", usuarioId: adminId }],
      observaciones: [],
    },
  ];

  await db.collection("solicitudes").insertMany(solicitudes);
  console.log(`📋 ${solicitudes.length} solicitudes creadas`);

  console.log("\n✅ Base de datos inicializada correctamente");
  console.log("─────────────────────────────────────");
  console.log("  Email:    admin@empresa.com");
  console.log("  Password: Admin1234");
  console.log("─────────────────────────────────────\n");

  await mongoose.disconnect();
  process.exit(0);
} catch (err) {
  console.error("❌ Error:", err.message);
  process.exit(1);
}
