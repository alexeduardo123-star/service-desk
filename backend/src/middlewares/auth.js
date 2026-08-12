import jwt from "jsonwebtoken";

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
