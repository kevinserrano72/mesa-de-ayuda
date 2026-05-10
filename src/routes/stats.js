import { Router } from "express";
import Solicitud from "../models/Solicitud.js";
import proteger from "../middlewares/auth.js";

const router = Router();

router.use(proteger);

// GET /api/stats  — resumen general del dashboard
router.get("/", async (req, res) => {
  try {
    const [porEstado, porTipo, porPrioridad, total] = await Promise.all([
      Solicitud.aggregate([
        { $match: { activo: true } },
        { $group: { _id: "$estado", cantidad: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Solicitud.aggregate([
        { $match: { activo: true } },
        { $group: { _id: "$tipo", cantidad: { $sum: 1 } } },
      ]),
      Solicitud.aggregate([
        { $match: { activo: true } },
        { $group: { _id: "$prioridad", cantidad: { $sum: 1 } } },
      ]),
      Solicitud.countDocuments({ activo: true }),
    ]);

    res.json({ total, porEstado, porTipo, porPrioridad });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener estadísticas" });
  }
});

export default router;
