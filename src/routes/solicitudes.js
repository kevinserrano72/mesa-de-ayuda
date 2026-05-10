import { Router } from "express";
import Solicitud from "../models/Solicitud.js";
import Contador from "../models/Contador.js";
import proteger from "../middlewares/auth.js";

const router = Router();

// Todas las rutas requieren autenticación
router.use(proteger);

// GET /api/solicitudes  — listar con filtros y paginación
router.get("/", async (req, res) => {
  try {
    const {
      estado,
      tipo,
      prioridad,
      responsable,
      page = 1,
      limit = 20,
    } = req.query;

    const filtro = { activo: true };
    if (estado) filtro.estado = estado;
    if (tipo) filtro.tipo = tipo;
    if (prioridad) filtro.prioridad = prioridad;
    if (responsable) filtro.responsable = responsable;

    const skip = (Number(page) - 1) * Number(limit);

    const [solicitudes, total] = await Promise.all([
      Solicitud.find(filtro)
        .populate("responsable", "nombre email")
        .populate("creadoPor", "nombre email")
        .sort({ fechaRegistro: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Solicitud.countDocuments(filtro),
    ]);

    res.json({
      total,
      pagina: Number(page),
      totalPaginas: Math.ceil(total / Number(limit)),
      solicitudes,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener solicitudes" });
  }
});

// GET /api/solicitudes/:id
router.get("/:id", async (req, res) => {
  try {
    const solicitud = await Solicitud.findOne({
      _id: req.params.id,
      activo: true,
    })
      .populate("responsable", "nombre email")
      .populate("creadoPor", "nombre email")
      .populate("historialEstados.usuarioId", "nombre email")
      .populate("observaciones.usuarioId", "nombre email");

    if (!solicitud) {
      return res.status(404).json({ mensaje: "Solicitud no encontrada" });
    }

    res.json(solicitud);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener la solicitud" });
  }
});

// POST /api/solicitudes  — crear nueva solicitud
router.post("/", async (req, res) => {
  try {
    const { titulo, descripcion, tipo, prioridad, solicitante } = req.body;

    // Generar código correlativo SOL-XXX
    const seq = await Contador.siguiente("solicitudes");
    const codigo = `SOL-${String(seq).padStart(3, "0")}`;

    const solicitud = await Solicitud.create({
      codigo,
      titulo,
      descripcion,
      tipo,
      prioridad,
      solicitante,
      creadoPor: req.usuario._id,
      historialEstados: [
        {
          estadoAnterior: null,
          estadoNuevo: "Registrada",
          usuarioId: req.usuario._id,
          observaciones: "Solicitud creada",
        },
      ],
    });

    res.status(201).json(solicitud);
  } catch (error) {
    console.error(error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ mensaje: error.message });
    }
    res.status(500).json({ mensaje: "Error al crear la solicitud" });
  }
});

// PUT /api/solicitudes/:id  — actualizar datos generales
router.put("/:id", async (req, res) => {
  try {
    const camposPermitidos = [
      "titulo",
      "descripcion",
      "tipo",
      "prioridad",
      "solicitante",
      "responsable",
    ];
    const actualizacion = {};
    camposPermitidos.forEach((campo) => {
      if (req.body[campo] !== undefined) actualizacion[campo] = req.body[campo];
    });

    const solicitud = await Solicitud.findOneAndUpdate(
      { _id: req.params.id, activo: true },
      { ...actualizacion, fechaActualizacion: new Date() },
      { new: true, runValidators: true }
    );

    if (!solicitud) {
      return res.status(404).json({ mensaje: "Solicitud no encontrada" });
    }

    res.json(solicitud);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al actualizar la solicitud" });
  }
});

// PATCH /api/solicitudes/:id/estado  — cambiar estado
router.patch("/:id/estado", async (req, res) => {
  try {
    const { estadoNuevo, observaciones } = req.body;

    const estadosValidos = [
      "Registrada",
      "En Proceso",
      "Resuelta",
      "Cerrada",
      "Anulada",
    ];
    if (!estadosValidos.includes(estadoNuevo)) {
      return res.status(400).json({ mensaje: "Estado no válido" });
    }

    const solicitud = await Solicitud.findOne({
      _id: req.params.id,
      activo: true,
    });
    if (!solicitud) {
      return res.status(404).json({ mensaje: "Solicitud no encontrada" });
    }

    const estadoAnterior = solicitud.estado;

    solicitud.historialEstados.push({
      estadoAnterior,
      estadoNuevo,
      observaciones,
      usuarioId: req.usuario._id,
    });

    solicitud.estado = estadoNuevo;
    solicitud.fechaActualizacion = new Date();

    if (estadoNuevo === "Cerrada" || estadoNuevo === "Resuelta") {
      solicitud.fechaCierre = new Date();
    }

    await solicitud.save();

    res.json(solicitud);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al cambiar el estado" });
  }
});

// POST /api/solicitudes/:id/observaciones  — agregar nota
router.post("/:id/observaciones", async (req, res) => {
  try {
    const { texto } = req.body;
    if (!texto) {
      return res.status(400).json({ mensaje: "El texto es requerido" });
    }

    const solicitud = await Solicitud.findOneAndUpdate(
      { _id: req.params.id, activo: true },
      {
        $push: {
          observaciones: { texto, usuarioId: req.usuario._id },
        },
        fechaActualizacion: new Date(),
      },
      { new: true }
    );

    if (!solicitud) {
      return res.status(404).json({ mensaje: "Solicitud no encontrada" });
    }

    res.status(201).json(solicitud);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al agregar observación" });
  }
});

// DELETE /api/solicitudes/:id  — soft delete
router.delete("/:id", async (req, res) => {
  try {
    const solicitud = await Solicitud.findOneAndUpdate(
      { _id: req.params.id, activo: true },
      { activo: false, fechaActualizacion: new Date() },
      { new: true }
    );

    if (!solicitud) {
      return res.status(404).json({ mensaje: "Solicitud no encontrada" });
    }

    res.json({ mensaje: "Solicitud eliminada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al eliminar la solicitud" });
  }
});

export default router;
