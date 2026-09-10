import { Router } from "express";
import {
  login,
  registrar,
  verificarEmail,
  reenviarVerificacao,
  esqueciSenha,
  redefinirSenha,
} from "../controllers/auth.controller.js";
import { loginLimiter, registroLimiter, resetSenhaLimiter } from "../middlewares/rateLimit.js";
import { validate } from "../middlewares/validate.js";
import {
  registrarSchema,
  loginSchema,
  emailSchema,
  verificarEmailSchema,
  redefinirSenhaSchema,
} from "../schemas/auth.schemas.js";

const router = Router();

router.post("/registro", registroLimiter, validate(registrarSchema), registrar);
router.post("/verificar-email", resetSenhaLimiter, validate(verificarEmailSchema), verificarEmail);
router.post("/reenviar-verificacao", registroLimiter, validate(emailSchema), reenviarVerificacao);
router.post("/login", loginLimiter, validate(loginSchema), login);
router.post("/esqueci-senha", resetSenhaLimiter, validate(emailSchema), esqueciSenha);
router.post("/redefinir-senha", resetSenhaLimiter, validate(redefinirSenhaSchema), redefinirSenha);

export default router;
