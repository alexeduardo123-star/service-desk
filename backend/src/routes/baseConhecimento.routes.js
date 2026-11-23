import { Router } from "express";
import * as artigos from "../controllers/baseConhecimento.controller.js";
import { authMiddleware, requirePermissao } from "../middlewares/auth.js";

const router = Router();

router.use(authMiddleware);

router.get("/", artigos.listar);
router.get("/:id", artigos.buscar);
router.post("/", requirePermissao("base.gerenciar"), artigos.criar);
router.put("/:id", requirePermissao("base.gerenciar"), artigos.atualizar);
router.delete("/:id", requirePermissao("base.gerenciar"), artigos.excluir);

export default router;
