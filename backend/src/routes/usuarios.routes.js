import { Router } from "express";
import * as usuarios from "../controllers/usuarios.controller.js";
import { authMiddleware, requirePermission } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { perfilSchema, alterarSenhaSchema } from "../schemas/usuario.schemas.js";

const router = Router();

router.use(authMiddleware);

router.get("/me", usuarios.me);
router.put("/me", validate(perfilSchema), usuarios.atualizarPerfil);
router.put("/me/senha", validate(alterarSenhaSchema), usuarios.alterarSenha);
router.get("/", requirePermission("USUARIOS_GERENCIAR"), usuarios.listar);
router.get("/:id", requirePermission("USUARIOS_GERENCIAR"), usuarios.buscar);
router.post("/", requirePermission("USUARIOS_GERENCIAR"), usuarios.criar);
router.put("/:id", requirePermission("USUARIOS_GERENCIAR"), usuarios.atualizar);
router.delete("/:id", requirePermission("USUARIOS_GERENCIAR"), usuarios.excluir);

export default router;
