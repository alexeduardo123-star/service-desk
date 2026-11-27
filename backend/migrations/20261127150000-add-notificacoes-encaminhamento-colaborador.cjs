"use strict";

// Equivalente a prisma/migrations/20261127150000_add_notificacoes_encaminhamento_colaborador:
// TipoNotificacao (no Sequelize: enum_notificacoes_tipo) ganha TICKET_ENCAMINHADO
// e TICKET_COLABORADOR, antes de SISTEMA.

const TIPO_NOTIFICACAO = "enum_notificacoes_tipo";
const NOVOS = ["TICKET_ENCAMINHADO", "TICKET_COLABORADOR"];
const ANTERIORES = ["TICKET_CRIADO", "TICKET_ATRIBUIDO", "TICKET_STATUS", "TICKET_COMENTARIO", "TICKET_APROVACAO", "SISTEMA"];

module.exports = {
  async up(queryInterface) {
    for (const valor of NOVOS) {
      await queryInterface.sequelize.query(
        `ALTER TYPE "${TIPO_NOTIFICACAO}" ADD VALUE IF NOT EXISTS '${valor}' BEFORE 'SISTEMA';`
      );
    }
  },

  async down(queryInterface) {
    // Postgres não remove valor de enum, então o tipo é recriado sem eles. As
    // notificações desses tipos são apagadas (o tipo deixa de existir).
    const lista = NOVOS.map((v) => `'${v}'`).join(", ");
    await queryInterface.sequelize.query(`DELETE FROM "notificacoes" WHERE "tipo" IN (${lista});`);
    await queryInterface.sequelize.query(`ALTER TYPE "${TIPO_NOTIFICACAO}" RENAME TO "${TIPO_NOTIFICACAO}_old";`);
    await queryInterface.sequelize.query(
      `CREATE TYPE "${TIPO_NOTIFICACAO}" AS ENUM (${ANTERIORES.map((v) => `'${v}'`).join(", ")});`
    );
    await queryInterface.sequelize.query(`ALTER TABLE "notificacoes" ALTER COLUMN "tipo" DROP DEFAULT;`);
    await queryInterface.sequelize.query(
      `ALTER TABLE "notificacoes" ALTER COLUMN "tipo" TYPE "${TIPO_NOTIFICACAO}" USING "tipo"::text::"${TIPO_NOTIFICACAO}";`
    );
    await queryInterface.sequelize.query(`ALTER TABLE "notificacoes" ALTER COLUMN "tipo" SET DEFAULT 'SISTEMA';`);
    await queryInterface.sequelize.query(`DROP TYPE "${TIPO_NOTIFICACAO}_old";`);
  },
};
