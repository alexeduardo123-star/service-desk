import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

export async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ erro: "Token não informado" });
  }

  let payload;
  try {
    payload = jwt.verify(header.slice("Bearer ".length), process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ erro: "Token inválido ou expirado" });
  }

  try {
    // O perfil vem do banco, não do JWT, para que alterações administrativas
    // e desativações tenham efeito imediato sem exigir novo login.
    const usuario = await prisma.usuario.findUnique({
      where: { id: Number(payload.id) },
      select: { id: true, nome: true, papel: true, ativo: true },
    });
    if (!usuario?.ativo) return res.status(401).json({ erro: "Sessão inválida ou usuário inativo" });
    req.user = { ...payload, id: usuario.id, nome: usuario.nome, papel: usuario.papel };
    next();
  } catch (erro) {
    next(erro);
  }
}

export function requirePermission(...permissoes) {
  return async (req, res, next) => {
    if (!req.user) return res.status(401).json({ erro: "Autenticação necessária" });
    if (req.user.papel === "ADMIN") return next();

    try {
      const concedidas = await prisma.perfilPermissao.findMany({
        where: { papel: req.user.papel, permissao: { chave: { in: permissoes } } },
        select: { permissao: { select: { chave: true } } },
      });
      const chaves = new Set(concedidas.map((item) => item.permissao.chave));
      if (!permissoes.some((permissao) => chaves.has(permissao))) {
        return res.status(403).json({ erro: "Você não possui permissão para realizar esta ação" });
      }
      next();
    } catch (erro) {
      next(erro);
    }
  };
}
