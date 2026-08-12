import { Router } from "express";
import * as artigos from "../controllers/baseConhecimento.controller.js";
import { authMiddleware, requireRole } from "../middlewares/auth.js";

const router = Router();

router.use(authMiddleware);

router.get("/", artigos.listar);
router.get("/:id", artigos.buscar);
router.post("/", requireRole("ADMIN", "TECNICO"), artigos.criar);
router.put("/:id", requireRole("ADMIN", "TECNICO"), artigos.atualizar);
router.delete("/:id", requireRole("ADMIN", "TECNICO"), artigos.excluir);

export default router;
