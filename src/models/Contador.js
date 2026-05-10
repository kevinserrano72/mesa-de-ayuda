import mongoose from "mongoose";

const contadorSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

/**
 * Incrementa el contador y devuelve el nuevo valor.
 * @param {string} nombre - Nombre del contador (ej: "solicitudes")
 * @returns {Promise<number>} El nuevo valor del contador
 */
contadorSchema.statics.siguiente = async function (nombre) {
  const contador = await this.findByIdAndUpdate(
    nombre,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return contador.seq;
};

const Contador = mongoose.model("contadores", contadorSchema);

export default Contador;
