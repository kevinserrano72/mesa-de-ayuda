import mongoose from "mongoose";

const solicitanteSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    telefono: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const solicitudSchema = new mongoose.Schema(
  {
    codigo: { type: String, required: true, unique: true, trim: true },
    titulo: { type: String, required: true, trim: true, maxlength: 200 },
    descripcion: { type: String, required: true, maxlength: 2000 },
    tipo: { type: String, required: true, trim: true },
    prioridad: {
      type: String,
      required: true,
      enum: ["Critica", "Alta", "Media", "Baja"],
    },
    estado: {
      type: String,
      required: true,
      enum: ["Registrada", "En Proceso", "Resuelta", "Cerrada", "Anulada"],
      default: "Registrada",
    },
    solicitante: { type: solicitanteSchema, required: true },
    creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
    responsable: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", default: null },
    observaciones: { type: String, default: "", maxlength: 1000 },
    fechaCreacion: { type: Date, default: Date.now },
    fechaCierre: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Solicitud", solicitudSchema);
