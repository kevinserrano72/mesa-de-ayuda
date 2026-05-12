import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import mongoose from "mongoose";
import Usuario from "../models/Usuario.js";
import Solicitud from "../models/Solicitud.js";
import Contador from "../models/Contador.js";

// Cargar .env desde la raíz del proyecto sin importar desde dónde se ejecute
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, "../../.env") });

console.log("🔍 MONGODB_URI:", process.env.MONGODB_URI ? "cargada ✓" : "NO encontrada ✗");

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Conectado a MongoDB Atlas");

    // Limpiar colecciones existentes
    await Promise.all([
      Usuario.deleteMany({}),
      Solicitud.deleteMany({}),
      Contador.deleteMany({}),
    ]);
    console.log("🗑️  Colecciones limpiadas");

    // Crear usuario administrador
    const admin = await Usuario.create({
      nombre: "Administrador",
      email: "admin@empresa.com",
      password: "Admin123!",
      rol: "administrador",
      activo: true,
    });
    console.log(`👤 Usuario creado: ${admin.email}`);

    // Inicializar contador
    await Contador.create({ _id: "solicitudes", seq: 0 });
    console.log("🔢 Contador inicializado");

    // Crear solicitudes de ejemplo
    const solicitudesData = [
      {
        codigo: "SOL-001",
        titulo: "Computador no enciende",
        descripcion: "El equipo del área de contabilidad no enciende desde esta mañana.",
        tipo: "Incidente",
        prioridad: "Alta",
        estado: "Registrada",
        solicitante: { nombre: "Juan Pérez", email: "juan@empresa.com", telefono: "555-1001" },
        creadoPor: admin._id,
      },
      {
        codigo: "SOL-002",
        titulo: "Instalación de software contable",
        descripcion: "Se requiere instalar el software ContaPlus en 3 equipos del área financiera.",
        tipo: "Requerimiento",
        prioridad: "Media",
        estado: "En Proceso",
        solicitante: { nombre: "María López", email: "maria@empresa.com", telefono: "555-1002" },
        responsable: admin._id,
        creadoPor: admin._id,
      },
      {
        codigo: "SOL-003",
        titulo: "¿Cómo acceder al correo desde casa?",
        descripcion: "Necesito saber cómo configurar el correo corporativo en mi celular personal.",
        tipo: "Consulta",
        prioridad: "Baja",
        estado: "Resuelta",
        solicitante: { nombre: "Carlos Ruiz", email: "carlos@empresa.com" },
        responsable: admin._id,
        creadoPor: admin._id,
        fechaCierre: new Date(),
      },
      {
        codigo: "SOL-004",
        titulo: "Internet muy lento en sala de reuniones",
        descripcion: "La conexión WiFi en la sala de reuniones principal es muy inestable.",
        tipo: "Incidente",
        prioridad: "Critica",
        estado: "En Proceso",
        solicitante: { nombre: "Ana Torres", email: "ana@empresa.com", telefono: "555-1004" },
        responsable: admin._id,
        creadoPor: admin._id,
      },
      {
        codigo: "SOL-005",
        titulo: "Solicitud de nuevo monitor",
        descripcion: "El monitor del puesto 12 tiene líneas horizontales y dificulta el trabajo.",
        tipo: "Requerimiento",
        prioridad: "Media",
        estado: "Registrada",
        solicitante: { nombre: "Pedro Gómez", email: "pedro@empresa.com" },
        creadoPor: admin._id,
      },
    ];

    // Agregar historial de estados a cada solicitud
    const solicitudesConHistorial = solicitudesData.map((s) => ({
      ...s,
      historialEstados: [
        {
          estadoAnterior: null,
          estadoNuevo: "Registrada",
          usuarioId: admin._id,
          observaciones: "Solicitud creada",
        },
        ...(s.estado !== "Registrada"
          ? [
              {
                estadoAnterior: "Registrada",
                estadoNuevo: s.estado,
                usuarioId: admin._id,
                observaciones: "Estado actualizado",
              },
            ]
          : []),
      ],
    }));

    await Solicitud.insertMany(solicitudesConHistorial);
    console.log(`📋 ${solicitudesData.length} solicitudes creadas`);

    // Actualizar contador al valor correcto
    await Contador.findByIdAndUpdate("solicitudes", { seq: solicitudesData.length });
    console.log(`🔢 Contador actualizado a ${solicitudesData.length}`);

    console.log("\n✅ Base de datos inicializada correctamente");
    console.log("─────────────────────────────────────");
    console.log("  Email:    admin@empresa.com");
    console.log("  Password: Admin123!");
    console.log("─────────────────────────────────────\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error en seed:", error.message);
    process.exit(1);
  }
};

seed();
