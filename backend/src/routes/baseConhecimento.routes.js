import { Router } from "express";
import * as artigos from "../controllers/baseConhecimento.controller.js";
import { authMiddleware, requirePermission } from "../middlewares/auth.js";

const router = Router();

router.use(authMiddleware);

router.get("/", artigos.listar);
router.get("/:id", artigos.buscar);
router.post("/", requirePermission("BASE_CONHECIMENTO_GERENCIAR"), artigos.criar);
router.put("/:id", requirePermission("BASE_CONHECIMENTO_GERENCIAR"), artigos.atualizar);
router.delete("/:id", requirePermission("BASE_CONHECIMENTO_GERENCIAR"), artigos.excluir);

export default router;
