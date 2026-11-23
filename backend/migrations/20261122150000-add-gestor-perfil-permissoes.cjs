"use strict";

// Equivalente a prisma/migrations/20261122150000_add_gestor_perfil_permissoes.
//
// O tipo do enum aqui é o que o Sequelize criou no createTable da migration
// inicial ("enum_<tabela>_<coluna>"), não o "PapelUsuario" do Prisma.

const TIPO = "enum_usuarios_papel";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `ALTER TYPE "${TIPO}" ADD VALUE IF NOT EXISTS 'GESTOR' BEFORE 'SOLICITANTE';`
    );

    await queryInterface.createTable("perfil_permissoes", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      papel: {
        type: Sequelize.ENUM("ADMIN", "TECNICO", "GESTOR", "SOLICITANTE"),
        allowNull: false,
      },
      permissao: { type: Sequelize.TEXT, allowNull: false },
      concedida: { type: Sequelize.BOOLEAN, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex("perfil_permissoes", ["papel", "permissao"], {
      name: "perfil_permissoes_papel_permissao_key",
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("perfil_permissoes");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_perfil_permissoes_papel";');

    // Postgres não remove valor de enum, então o tipo é recriado sem ele. Quem
    // era gestor volta a ser técnico.
    await queryInterface.sequelize.query(`UPDATE "usuarios" SET "papel" = 'TECNICO' WHERE "papel" = 'GESTOR';`);
    await queryInterface.sequelize.query(`ALTER TYPE "${TIPO}" RENAME TO "${TIPO}_old";`);
    await queryInterface.sequelize.query(
      `CREATE TYPE "${TIPO}" AS ENUM ('ADMIN', 'TECNICO', 'SOLICITANTE');`
    );
    await queryInterface.sequelize.query(`ALTER TABLE "usuarios" ALTER COLUMN "papel" DROP DEFAULT;`);
    await queryInterface.sequelize.query(
      `ALTER TABLE "usuarios" ALTER COLUMN "papel" TYPE "${TIPO}" USING "papel"::text::"${TIPO}";`
    );
    await queryInterface.sequelize.query(`ALTER TABLE "usuarios" ALTER COLUMN "papel" SET DEFAULT 'SOLICITANTE';`);
    await queryInterface.sequelize.query(`DROP TYPE "${TIPO}_old";`);
  },
};
