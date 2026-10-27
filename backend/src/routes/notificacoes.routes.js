import { Router } from "express";
import * as notificacoes from "../controllers/notificacoes.controller.js";
import { authMiddleware, requireRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { criarNotificacaoSchema, marcarLidaSchema } from "../schemas/notificacao.schemas.js";

const router = Router();

router.use(authMiddleware);

// Rotas fixas antes de "/:id" para não serem interpretadas como um id.
router.get("/nao-lidas/contagem", notificacoes.contarNaoLidas);
router.patch("/ler-todas", notificacoes.marcarTodasLidas);
router.delete("/lidas", notificacoes.excluirLidas);

router.get("/", notificacoes.listar);
router.get("/:id", notificacoes.buscar);
router.post("/", requireRole("ADMIN"), validate(criarNotificacaoSchema), notificacoes.criar);
router.patch("/:id/lida", validate(marcarLidaSchema), notificacoes.marcarLida);
router.delete("/:id", notificacoes.excluir);

export default router;
