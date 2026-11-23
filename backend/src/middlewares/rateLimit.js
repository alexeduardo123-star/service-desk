import rateLimit, { ipKeyGenerator } from "express-rate-limit";

const QUINZE_MIN = 15 * 60 * 1000;

const base = { standardHeaders: true, legacyHeaders: false };

// Chave por email (normalizado), separada por rota. Assim várias pessoas na
// mesma rede (mesmo IP, ex.: sala de aula na apresentação) não esgotam o
// limite umas das outras.
function chavePorEmail(req) {
  const email = String(req.body?.email || "").trim().toLowerCase();
  return `${req.path}:${email || ipKeyGenerator(req.ip)}`;
}

// Teto geral por IP para as rotas de autenticação, contra quem tenta muitos
// emails diferentes a partir da mesma máquina. Folgado o bastante para uma turma.
export const authPorIpLimiter = rateLimit({
  ...base,
  windowMs: QUINZE_MIN,
  limit: 100,
  message: { erro: "Muitas tentativas a partir desta rede. Tente novamente em alguns minutos." },
});

export const loginLimiter = rateLimit({
  ...base,
  windowMs: QUINZE_MIN,
  limit: 10,
  keyGenerator: chavePorEmail,
  message: { erro: "Muitas tentativas de login. Tente novamente em alguns minutos." },
});

export const registroLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  limit: 30,
  message: { erro: "Muitas tentativas de cadastro. Tente novamente mais tarde." },
});

// Pedidos que disparam um email (reenviar código, esqueci a senha). Contados
// por email, para ninguém lotar a caixa de outra pessoa.
export const envioCodigoLimiter = rateLimit({
  ...base,
  windowMs: QUINZE_MIN,
  limit: 5,
  keyGenerator: chavePorEmail,
  message: { erro: "Muitos pedidos de código para este email. Aguarde alguns minutos." },
});

// Mais restritivo: protege o código de 6 dígitos (1 em 1.000.000) contra
// força bruta dentro da janela de 15 min em que ele é válido. Contado por
// email (por conta), então quem erra o próprio código não bloqueia os colegas.
export const verificacaoCodigoLimiter = rateLimit({
  ...base,
  windowMs: QUINZE_MIN,
  limit: 6,
  keyGenerator: chavePorEmail,
  message: { erro: "Muitas tentativas com código inválido. Aguarde alguns minutos e peça um novo código." },
});
