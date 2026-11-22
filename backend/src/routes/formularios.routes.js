import { Router } from "express";
import * as controller from "../controllers/formularios.controller.js";
import { authMiddleware, requirePermission } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { validateId } from "../middlewares/validateId.js";
import { formularioSchema } from "../schemas/formulario.schema.js";

const router = Router();

router.use(authMiddleware);

// Leitura liberada para qualquer usuário logado (usada ao abrir chamados);
// cadastro e manutenção ficam com o administrador.
router.get("/", controller.listar);
router.get("/:id", validateId, controller.buscar);

router.post("/", requirePermission("FORMULARIOS_GERENCIAR"), validate(formularioSchema), controller.criar);
router.put("/:id", requirePermission("FORMULARIOS_GERENCIAR"), validateId, validate(formularioSchema), controller.atualizar);
router.delete("/:id", requirePermission("FORMULARIOS_GERENCIAR"), validateId, controller.excluir);

export default router;
