"use strict";

// Equivalente a prisma/migrations/20261116190000_add_aguardando_usuario_status.
//
// O tipo do enum aqui é o que o Sequelize criou no createTable da migration
// inicial ("enum_<tabela>_<coluna>"), não o "StatusTicket" do Prisma.

const TIPO = "enum_tickets_status";

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `ALTER TYPE "${TIPO}" ADD VALUE IF NOT EXISTS 'AGUARDANDO_USUARIO' BEFORE 'FECHADO';`
    );
  },

  async down(queryInterface) {
    // Postgres não remove valor de enum, então o tipo é recriado sem ele. Os
    // chamados que estavam aguardando o usuário voltam para "Em andamento".
    await queryInterface.sequelize.query(
      `UPDATE "tickets" SET "status" = 'EM_ANDAMENTO' WHERE "status" = 'AGUARDANDO_USUARIO';`
    );
    await queryInterface.sequelize.query(`ALTER TYPE "${TIPO}" RENAME TO "${TIPO}_old";`);
    await queryInterface.sequelize.query(`CREATE TYPE "${TIPO}" AS ENUM ('ABERTO', 'EM_ANDAMENTO', 'FECHADO');`);
    await queryInterface.sequelize.query(`ALTER TABLE "tickets" ALTER COLUMN "status" DROP DEFAULT;`);
    await queryInterface.sequelize.query(
      `ALTER TABLE "tickets" ALTER COLUMN "status" TYPE "${TIPO}" USING "status"::text::"${TIPO}";`
    );
    await queryInterface.sequelize.query(`ALTER TABLE "tickets" ALTER COLUMN "status" SET DEFAULT 'ABERTO';`);
    await queryInterface.sequelize.query(`DROP TYPE "${TIPO}_old";`);
  },
};
