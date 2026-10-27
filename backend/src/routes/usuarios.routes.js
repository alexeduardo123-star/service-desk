import { Router } from "express";
import * as usuarios from "../controllers/usuarios.controller.js";
import { authMiddleware, requireRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { perfilSchema, alterarSenhaSchema } from "../schemas/usuario.schemas.js";

const router = Router();

router.use(authMiddleware);

router.get("/me", usuarios.me);
router.put("/me", validate(perfilSchema), usuarios.atualizarPerfil);
router.put("/me/senha", validate(alterarSenhaSchema), usuarios.alterarSenha);
router.get("/", requireRole("ADMIN"), usuarios.listar);
router.get("/:id", requireRole("ADMIN"), usuarios.buscar);
router.post("/", requireRole("ADMIN"), usuarios.criar);
router.put("/:id", requireRole("ADMIN"), usuarios.atualizar);
router.delete("/:id", requireRole("ADMIN"), usuarios.excluir);

export default router;
