const MSG_BANCO_DESATUALIZADO =
  "O banco de dados está desatualizado (faltam tabelas/colunas). Pare o projeto e rode `npm run dev` " +
  "(ou `npx prisma migrate deploy` na pasta backend).";

const MSG_SEM_BANCO =
  "Não foi possível conectar ao banco de dados. Verifique se o Docker Desktop está aberto e rode `npm run setup`.";

export function errorHandler(err, req, res, _next) {
  console.error(err);

  if (err.code === "P2002") {
    return res.status(409).json({ erro: "Registro duplicado (campo único já existe)" });
  }
  if (err.code === "P2003") {
    return res.status(409).json({ erro: "Não é possível excluir: há registros vinculados" });
  }
  if (err.code === "P2025") {
    return res.status(404).json({ erro: "Registro não encontrado" });
  }
  // Tabela/coluna inexistente: migrations não aplicadas.
  if (err.code === "P2021" || err.code === "P2022") {
    return res.status(500).json({ erro: MSG_BANCO_DESATUALIZADO });
  }
  // Banco fora do ar, credenciais erradas, banco inexistente etc.
  if (err.name === "PrismaClientInitializationError" || /^P10\d\d$/.test(err.code || "")) {
    return res.status(503).json({ erro: MSG_SEM_BANCO });
  }
  // Qualquer outro erro do Prisma: não vaza a mensagem técnica para a tela.
  if (err.name?.startsWith("PrismaClient")) {
    return res.status(500).json({ erro: "Erro ao acessar o banco de dados. Veja o terminal do backend." });
  }

  res.status(err.status || 500).json({ erro: err.message || "Erro interno do servidor" });
}
