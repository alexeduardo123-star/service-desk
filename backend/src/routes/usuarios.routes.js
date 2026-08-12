import { Router } from "express";
import * as usuarios from "../controllers/usuarios.controller.js";
import { authMiddleware, requireRole } from "../middlewares/auth.js";

const router = Router();

router.use(authMiddleware);

router.get("/me", usuarios.me);
router.get("/", requireRole("ADMIN"), usuarios.listar);
router.get("/:id", requireRole("ADMIN"), usuarios.buscar);
router.post("/", requireRole("ADMIN"), usuarios.criar);
router.put("/:id", requireRole("ADMIN"), usuarios.atualizar);
router.delete("/:id", requireRole("ADMIN"), usuarios.excluir);

export default router;
