import { Router } from "express";
import * as controller from "../controllers/fornecedores.controller.js";
import { authMiddleware, requirePermission } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { validateId } from "../middlewares/validateId.js";
import { fornecedorSchema } from "../schemas/fornecedor.schema.js";

const router = Router();

router.use(authMiddleware);

router.get("/", requirePermission("FORNECEDORES_ACESSAR"), controller.listar);
router.get("/:id", requirePermission("FORNECEDORES_ACESSAR"), validateId, controller.buscar);

router.post("/", requirePermission("FORNECEDORES_GERENCIAR"), validate(fornecedorSchema), controller.criar);
router.put("/:id", requirePermission("FORNECEDORES_GERENCIAR"), validateId, validate(fornecedorSchema), controller.atualizar);
router.delete("/:id", requirePermission("FORNECEDORES_GERENCIAR"), validateId, controller.excluir);

export default router;
