import { Router } from "express";
import * as controller from "../controllers/agenda.controller.js";
import { authMiddleware, requirePermissao } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { validateId } from "../middlewares/validateId.js";
import { agendamentoSchema } from "../schemas/agenda.schemas.js";

const router = Router();

router.use(authMiddleware);

router.get("/", requirePermissao("agenda.ver"), controller.listar);
router.post("/", requirePermissao("agenda.gerenciar"), validate(agendamentoSchema), controller.criar);
router.put("/:id", requirePermissao("agenda.gerenciar"), validateId, validate(agendamentoSchema), controller.atualizar);
router.delete("/:id", requirePermissao("agenda.gerenciar"), validateId, controller.excluir);

export default router;
