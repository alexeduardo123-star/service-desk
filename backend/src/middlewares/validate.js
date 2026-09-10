export function validate(schema) {
  return (req, res, next) => {
    const resultado = schema.safeParse(req.body);
    if (!resultado.success) {
      const primeiro = resultado.error.issues[0];
      return res.status(400).json({ erro: primeiro?.message || "Dados inválidos" });
    }
    req.body = resultado.data;
    next();
  };
}
