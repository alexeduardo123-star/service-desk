import { Router } from "express";
import {
  login,
  registrar,
  verificarEmail,
  reenviarVerificacao,
  esqueciSenha,
  redefinirSenha,
} from "../controllers/auth.controller.js";
import {
  authPorIpLimiter,
  loginLimiter,
  registroLimiter,
  envioCodigoLimiter,
  verificacaoCodigoLimiter,
} from "../middlewares/rateLimit.js";
import { validate } from "../middlewares/validate.js";
import {
  registrarSchema,
  loginSchema,
  emailSchema,
  verificarEmailSchema,
  redefinirSenhaSchema,
} from "../schemas/auth.schemas.js";

const router = Router();

router.use(authPorIpLimiter);

router.post("/registro", registroLimiter, validate(registrarSchema), registrar);
router.post("/verificar-email", verificacaoCodigoLimiter, validate(verificarEmailSchema), verificarEmail);
router.post("/reenviar-verificacao", envioCodigoLimiter, validate(emailSchema), reenviarVerificacao);
router.post("/login", loginLimiter, validate(loginSchema), login);
router.post("/esqueci-senha", envioCodigoLimiter, validate(emailSchema), esqueciSenha);
router.post("/redefinir-senha", verificacaoCodigoLimiter, validate(redefinirSenhaSchema), redefinirSenha);

export default router;
