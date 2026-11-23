import { Router } from "express";
import * as controller from "../controllers/fornecedores.controller.js";
import { authMiddleware, requirePermissao } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { validateId } from "../middlewares/validateId.js";
import { fornecedorSchema } from "../schemas/fornecedor.schema.js";

const router = Router();

router.use(authMiddleware);

router.get("/", requirePermissao("fornecedores.ver"), controller.listar);
router.get("/:id", requirePermissao("fornecedores.ver"), validateId, controller.buscar);

router.post("/", requirePermissao("fornecedores.gerenciar"), validate(fornecedorSchema), controller.criar);
router.put("/:id", requirePermissao("fornecedores.gerenciar"), validateId, validate(fornecedorSchema), controller.atualizar);
router.delete("/:id", requirePermissao("fornecedores.gerenciar"), validateId, controller.excluir);

export default router;
