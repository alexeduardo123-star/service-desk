import { Router } from "express";
import * as controller from "../controllers/contratos.controller.js";
import { authMiddleware, requireRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { contratoSchema } from "../schemas/contrato.schema.js";

const router = Router();
router.use(authMiddleware, requireRole("ADMIN", "TECNICO"));
router.get("/", controller.listar);
router.get("/:id", controller.buscar);
router.post("/", validate(contratoSchema), controller.criar);
router.put("/:id", validate(contratoSchema), controller.atualizar);
router.delete("/:id", requireRole("ADMIN"), controller.excluir);
export default router;
