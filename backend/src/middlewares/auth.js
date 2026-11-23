import jwt from "jsonwebtoken";
import { papelTemPermissao } from "../utils/permissoes.js";
import { obterOverrides } from "../utils/permissoesCache.js";

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ erro: "Token não informado" });
  }

  const token = header.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, nome, papel }
    next();
  } catch {
    res.status(401).json({ erro: "Token inválido ou expirado" });
  }
}

export function requireRole(...papeis) {
  return (req, res, next) => {
    if (!req.user || !papeis.includes(req.user.papel)) {
      return res.status(403).json({ erro: "Acesso negado para este perfil" });
    }
    next();
  };
}

// Libera a rota se o perfil do usuário tiver QUALQUER uma das permissões
// informadas (veja src/utils/permissoes.js). Substitui o requireRole nas rotas,
// para o administrador poder ajustar o que cada perfil faz sem mexer no código.
export function requirePermissao(...chaves) {
  return async (req, res, next) => {
    try {
      if (!req.user) return res.status(403).json({ erro: "Acesso negado para este perfil" });
      const overrides = await obterOverrides();
      const autorizado = chaves.some((chave) => papelTemPermissao(req.user.papel, chave, overrides));
      if (!autorizado) return res.status(403).json({ erro: "Acesso negado para este perfil" });
      next();
    } catch (err) {
      next(err);
    }
  };
}
