import { Router } from "express";
import Solicitud from "../models/Solicitud.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const todas = await Solicitud.find({}).lean();

    const porEstado = {
      registrada: 0,
      enProceso: 0,
      resuelta: 0,
      cerrada: 0,
      anulada: 0,
    };

    const porPrioridad = {
      critica: 0,
      alta: 0,
      media: 0,
      baja: 0,
    };

    for (const s of todas) {
      const e = s.estado;
      if (e === "Registrada") porEstado.registrada += 1;
      else if (e === "En Proceso") porEstado.enProceso += 1;
      else if (e === "Resuelta") porEstado.resuelta += 1;
      else if (e === "Cerrada") porEstado.cerrada += 1;
      else if (e === "Anulada") porEstado.anulada += 1;

      const p = s.prioridad;
      if (p === "Critica") porPrioridad.critica += 1;
      else if (p === "Alta") porPrioridad.alta += 1;
      else if (p === "Media") porPrioridad.media += 1;
      else if (p === "Baja") porPrioridad.baja += 1;
    }

    const recientes = [...todas]
      .sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion))
      .slice(0, 5);

    return res.json({
      success: true,
      data: {
        total: todas.length,
        porEstado,
        porPrioridad,
        recientes,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Error al obtener estadísticas." });
  }
});

export default router;
