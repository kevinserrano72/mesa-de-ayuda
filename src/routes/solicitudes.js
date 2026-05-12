import { Router } from "express";
import mongoose from "mongoose";
import Solicitud from "../models/Solicitud.js";
import Contador from "../models/Contador.js";

const router = Router();

const FLUJO_ESTADOS = {
  Registrada: ["En Proceso", "Anulada"],
  "En Proceso": ["Registrada", "Resuelta", "Anulada"],
  Resuelta: ["En Proceso", "Cerrada"],
  Cerrada: [],
  Anulada: [],
};

function toCliente(doc) {
  return doc.toObject ? doc.toObject() : { ...doc };
}

function permitidoTransicion(actual, siguiente) {
  const allowed = FLUJO_ESTADOS[actual] || [];
  return allowed.includes(siguiente);
}

async function siguienteCodigo() {
  const updated = await Contador.findByIdAndUpdate(
    "solicitudes",
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const n = updated.seq;
  return `SOL-${String(n).padStart(3, "0")}`;
}

router.get("/", async (req, res) => {
  try {
    const { estado, prioridad, tipo, busqueda } = req.query;
    const filtro = {};

    if (estado && estado !== "Todos") filtro.estado = estado;
    if (prioridad && prioridad !== "Todas") filtro.prioridad = prioridad;
    if (tipo && tipo !== "Todos") filtro.tipo = tipo;

    if (busqueda && String(busqueda).trim()) {
      const q = String(busqueda).trim();
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filtro.$or = [
        { codigo: rx },
        { titulo: rx },
        { "solicitante.nombre": rx },
        { "solicitante.email": rx },
      ];
    }

    const data = await Solicitud.find(filtro).sort({ fechaCreacion: -1 }).lean();
    return res.json({ success: true, data, total: data.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Error al listar solicitudes." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "ID inválido." });
    }
    const s = await Solicitud.findById(req.params.id).lean();
    if (!s) {
      return res.status(404).json({ success: false, message: "Solicitud no encontrada." });
    }
    return res.json({ success: true, data: toCliente(s) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Error al obtener la solicitud." });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      titulo,
      descripcion,
      tipo,
      prioridad,
      solicitanteNombre,
      solicitanteEmail,
      solicitanteTelefono,
    } = req.body;

    const codigo = await siguienteCodigo();
    const usuarioId = req.userId;

    const doc = await Solicitud.create({
      codigo,
      titulo: String(titulo || "").trim(),
      descripcion: String(descripcion || "").trim(),
      tipo: String(tipo || "").trim(),
      prioridad: prioridad || "Media",
      estado: "Registrada",
      solicitante: {
        nombre: String(solicitanteNombre || "").trim(),
        email: String(solicitanteEmail || "").trim().toLowerCase(),
        telefono: solicitanteTelefono ? String(solicitanteTelefono).trim() : "",
      },
      creadoPor: usuarioId,
    });

    return res.status(201).json({
      success: true,
      message: "Solicitud registrada correctamente.",
      data: toCliente(doc),
    });
  } catch (err) {
    console.error(err);
    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(err.errors)
          .map((e) => e.message)
          .join(" "),
      });
    }
    return res.status(500).json({ success: false, message: "Error al crear la solicitud." });
  }
});

router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "ID inválido." });
    }

    const solicitud = await Solicitud.findById(req.params.id);
    if (!solicitud) {
      return res.status(404).json({ success: false, message: "Solicitud no encontrada." });
    }

    const body = req.body || {};
    const isFullEdit = body.titulo !== undefined;

    const estadoSolicitado =
      body.estado !== undefined &&
      body.estado !== null &&
      String(body.estado).trim() !== ""
        ? String(body.estado).trim()
        : null;

    if (isFullEdit) {
      solicitud.titulo = String(body.titulo ?? solicitud.titulo).trim();
      solicitud.descripcion = String(body.descripcion ?? solicitud.descripcion).trim();
      solicitud.tipo = String(body.tipo ?? solicitud.tipo).trim();
      solicitud.prioridad = body.prioridad ?? solicitud.prioridad;
      solicitud.solicitante.nombre = String(
        body.solicitanteNombre ?? solicitud.solicitante.nombre
      ).trim();
      solicitud.solicitante.email = String(
        body.solicitanteEmail ?? solicitud.solicitante.email
      )
        .trim()
        .toLowerCase();
      if (body.observaciones !== undefined) {
        solicitud.observaciones = String(body.observaciones).trim();
      }
    }

    if (estadoSolicitado !== null && estadoSolicitado !== solicitud.estado) {
      const actual = solicitud.estado;
      if (!permitidoTransicion(actual, estadoSolicitado)) {
        return res.status(400).json({
          success: false,
          message: `No se puede pasar de "${actual}" a "${estadoSolicitado}".`,
        });
      }

      solicitud.estado = estadoSolicitado;

      if (estadoSolicitado === "Resuelta" || estadoSolicitado === "Cerrada") {
        solicitud.fechaCierre = new Date();
      } else if (estadoSolicitado === "En Proceso" || estadoSolicitado === "Registrada") {
        solicitud.fechaCierre = null;
      }
    }

    await solicitud.save();
    return res.json({
      success: true,
      message: "Solicitud actualizada correctamente.",
      data: toCliente(solicitud),
    });
  } catch (err) {
    console.error(err);
    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(err.errors)
          .map((e) => e.message)
          .join(" "),
      });
    }
    return res.status(500).json({ success: false, message: "Error al actualizar la solicitud." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "ID inválido." });
    }
    const deleted = await Solicitud.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Solicitud no encontrada." });
    }
    return res.json({ success: true, message: "Solicitud eliminada correctamente." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Error al eliminar la solicitud." });
  }
});

export default router;
