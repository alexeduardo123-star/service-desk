import { Router } from "express";
import * as tickets from "../controllers/tickets.controller.js";
import * as comentarios from "../controllers/comentarios.controller.js";
import { authMiddleware, requireRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { alterarStatusSchema, atribuirSchema } from "../schemas/ticket.schemas.js";

const router = Router();

router.use(authMiddleware);

router.get("/", tickets.listar);
router.get("/:id", tickets.buscar);
router.post("/", tickets.criar);
router.put("/:id", tickets.atualizar);
router.patch("/:id/status", requireRole("ADMIN", "TECNICO"), validate(alterarStatusSchema), tickets.alterarStatus);
router.patch("/:id/atribuir", requireRole("ADMIN", "TECNICO"), validate(atribuirSchema), tickets.atribuir);
router.delete("/:id", requireRole("ADMIN"), tickets.excluir);

router.get("/:ticketId/comentarios", comentarios.listar);
router.post("/:ticketId/comentarios", comentarios.criar);
router.put("/:ticketId/comentarios/:id", comentarios.atualizar);
router.delete("/:ticketId/comentarios/:id", comentarios.excluir);

export default router;
