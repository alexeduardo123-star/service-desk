import { Router } from "express";
import * as configuracoes from "../controllers/configuracoes.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { configuracaoSchema } from "../schemas/configuracao.schemas.js";

const router = Router();

router.use(authMiddleware);

router.get("/me", configuracoes.obter);
router.put("/me", validate(configuracaoSchema), configuracoes.atualizar);
router.delete("/me", configuracoes.restaurarPadrao);

export default router;
