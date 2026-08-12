export function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.code === "P2002") {
    return res.status(409).json({ erro: "Registro duplicado (campo único já existe)" });
  }
  if (err.code === "P2025") {
    return res.status(404).json({ erro: "Registro não encontrado" });
  }

  res.status(err.status || 500).json({ erro: err.message || "Erro interno do servidor" });
}
