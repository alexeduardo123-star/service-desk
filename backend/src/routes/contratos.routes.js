import { Router } from "express";
import * as controller from "../controllers/contratos.controller.js";
import { authMiddleware, requirePermissao } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { validateId } from "../middlewares/validateId.js";
import { contratoSchema } from "../schemas/contrato.schema.js";

const router = Router();

router.use(authMiddleware, requirePermissao("contratos.ver"));

router.get("/", controller.listar);
router.get("/:id", validateId, controller.buscar);
router.post("/", requirePermissao("contratos.gerenciar"), validate(contratoSchema), controller.criar);
router.put("/:id", requirePermissao("contratos.gerenciar"), validateId, validate(contratoSchema), controller.atualizar);
router.delete("/:id", requirePermissao("contratos.excluir"), validateId, controller.excluir);

export default router;
