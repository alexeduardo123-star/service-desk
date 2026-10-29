import { Router } from "express";
import * as relatorios from "../controllers/relatorios.controller.js";
import { authMiddleware, requireRole } from "../middlewares/auth.js";

const router = Router();

router.use(authMiddleware, requireRole("ADMIN", "TECNICO"));

router.get("/chamados", relatorios.chamados);

export default router;
