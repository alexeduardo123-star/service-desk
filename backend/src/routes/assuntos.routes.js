import { Router } from "express";
import * as controller from "../controllers/assuntos.controller.js";
import { authMiddleware, requireRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { validateId } from "../middlewares/validateId.js";
import { assuntoSchema } from "../schemas/assunto.schema.js";

const router = Router();

router.use(authMiddleware);

// Leitura liberada para qualquer usuário logado (usada ao abrir chamados);
// cadastro e manutenção ficam com o administrador.
router.get("/", controller.listar);
router.get("/:id", validateId, controller.buscar);

router.post("/", requireRole("ADMIN"), validate(assuntoSchema), controller.criar);
router.put("/:id", requireRole("ADMIN"), validateId, validate(assuntoSchema), controller.atualizar);
router.delete("/:id", requireRole("ADMIN"), validateId, controller.excluir);

export default router;
