require("dotenv/config");

// Reaproveita a mesma DATABASE_URL usada pelo Prisma (ver .env / .env.example)
// em vez de duplicar host/usuário/senha aqui.
const shared = {
  use_env_variable: "DATABASE_URL",
  dialect: "postgres",
};

module.exports = {
  development: shared,
  test: shared,
  production: shared,
};
