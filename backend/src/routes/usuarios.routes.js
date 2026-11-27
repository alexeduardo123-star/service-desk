import { Router } from "express";
import * as usuarios from "../controllers/usuarios.controller.js";
import { authMiddleware, requirePermissao } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { perfilSchema, alterarSenhaSchema } from "../schemas/usuario.schemas.js";

const router = Router();

router.use(authMiddleware);

router.get("/me", usuarios.me);
router.put("/me", validate(perfilSchema), usuarios.atualizarPerfil);
router.put("/me/senha", validate(alterarSenhaSchema), usuarios.alterarSenha);
// Antes de "/:id", senão "atendentes" seria lido como um id.
router.get("/atendentes", requirePermissao("cadastros.gerenciar", "tickets.tratar", "agenda.ver"), usuarios.listarAtendentes);
router.get("/", requirePermissao("usuarios.gerenciar"), usuarios.listar);
router.get("/:id", requirePermissao("usuarios.gerenciar"), usuarios.buscar);
router.post("/", requirePermissao("usuarios.gerenciar"), usuarios.criar);
router.put("/:id", requirePermissao("usuarios.gerenciar"), usuarios.atualizar);
router.delete("/:id", requirePermissao("usuarios.gerenciar"), usuarios.excluir);

export default router;
