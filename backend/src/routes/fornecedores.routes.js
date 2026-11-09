import { Router } from "express";
import * as controller from "../controllers/fornecedores.controller.js";
import { authMiddleware, requireRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { validateId } from "../middlewares/validateId.js";
import { fornecedorSchema } from "../schemas/fornecedor.schema.js";

const router = Router();

router.use(authMiddleware);

router.get("/", requireRole("ADMIN", "TECNICO"), controller.listar);
router.get("/:id", requireRole("ADMIN", "TECNICO"), validateId, controller.buscar);

router.post("/", requireRole("ADMIN"), validate(fornecedorSchema), controller.criar);
router.put("/:id", requireRole("ADMIN"), validateId, validate(fornecedorSchema), controller.atualizar);
router.delete("/:id", requireRole("ADMIN"), validateId, controller.excluir);

export default router;
