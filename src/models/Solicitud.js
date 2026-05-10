import mongoose from "mongoose";

// Schema para el historial de cambios de estado
const historialEstadoSchema = new mongoose.Schema(
  {
    estadoAnterior: { type: String },
    estadoNuevo: { type: String },
    fecha: { type: Date, default: Date.now },
    observaciones: { type: String },
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: "usuarios" },
  },
  { _id: false }
);

// Schema para las observaciones/notas del caso
const observacionSchema = new mongoose.Schema(
  {
    texto: { type: String, required: true },
    fecha: { type: Date, default: Date.now },
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: "usuarios" },
  },
  { _id: false }
);

const solicitudSchema = new mongoose.Schema({
  codigo: {
    type: String,
    unique: true,
    required: true,
  },
  titulo: {
    type: String,
    required: true,
    trim: true,
  },
  descripcion: {
    type: String,
    required: true,
  },
  tipo: {
    type: String,
    enum: ["Incidente", "Requerimiento", "Consulta"],
    required: true,
  },
  prioridad: {
    type: String,
    enum: ["Critica", "Alta", "Media", "Baja"],
    required: true,
  },
  estado: {
    type: String,
    enum: ["Registrada", "En Proceso", "Resuelta", "Cerrada", "Anulada"],
    default: "Registrada",
  },
  // Datos del solicitante (embebido)
  solicitante: {
    nombre: { type: String, required: true },
    email: { type: String, required: true },
    telefono: { type: String },
  },
  // Usuario asignado para atender el caso
  responsable: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "usuarios",
    default: null,
  },
  historialEstados: [historialEstadoSchema],
  observaciones: [observacionSchema],
  // Metadatos
  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "usuarios",
  },
  fechaRegistro: {
    type: Date,
    default: Date.now,
  },
  fechaActualizacion: {
    type: Date,
    default: Date.now,
  },
  fechaCierre: {
    type: Date,
  },
  activo: {
    type: Boolean,
    default: true,
  },
});

// Actualizar fechaActualizacion antes de cada save
solicitudSchema.pre("save", function (next) {
  this.fechaActualizacion = new Date();
  next();
});

const Solicitud = mongoose.model("solicitudes", solicitudSchema);

export default Solicitud;
