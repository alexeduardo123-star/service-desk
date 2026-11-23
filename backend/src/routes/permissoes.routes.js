import { Router } from "express";
import * as permissoes from "../controllers/permissoes.controller.js";
import { authMiddleware, requirePermissao } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { permissaoSchema } from "../schemas/permissao.schemas.js";

const router = Router();

router.use(authMiddleware);

router.get("/me", permissoes.minhas);
router.get("/", requirePermissao("permissoes.gerenciar"), permissoes.listar);
router.put("/", requirePermissao("permissoes.gerenciar"), validate(permissaoSchema), permissoes.atualizar);

export default router;
