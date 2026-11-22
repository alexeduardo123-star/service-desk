import { Router } from "express";
import * as controller from "../controllers/permissoes.controller.js";
import { authMiddleware, requirePermission } from "../middlewares/auth.js";

const router = Router();
router.use(authMiddleware, requirePermission("PERFIS_GERENCIAR"));
router.get("/", controller.listar);
router.put("/:papel", controller.atualizarPerfil);
export default router;
