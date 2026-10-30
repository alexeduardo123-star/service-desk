import { Router } from "express";
import * as relatorios from "../controllers/relatorios.controller.js";
import * as salvos from "../controllers/relatoriosSalvos.controller.js";
import { authMiddleware, requireRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { relatorioSalvoSchema, relatorioSalvoAtualizacaoSchema } from "../schemas/relatorio.schemas.js";

const router = Router();

router.use(authMiddleware, requireRole("ADMIN", "TECNICO"));

router.get("/chamados", relatorios.chamados);

// Filtros salvos (CRUD por usuário)
router.get("/salvos", salvos.listar);
router.get("/salvos/:id", salvos.buscar);
router.post("/salvos", validate(relatorioSalvoSchema), salvos.criar);
router.put("/salvos/:id", validate(relatorioSalvoAtualizacaoSchema), salvos.atualizar);
router.delete("/salvos/:id", salvos.excluir);

export default router;
