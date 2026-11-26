"use strict";

// Equivalente a prisma/migrations/20261122170000_add_aprovacao_gestor.
//
// - categorias.exigeAprovacao: chamados da categoria esperam o gestor do setor.
// - tickets.aprovacaoStatus/aprovadorId/aprovacaoEm/aprovacaoMotivo: andamento
//   da aprovação. Chamados que já existem ficam como NAO_EXIGIDA.
// - TipoNotificacao ganha TICKET_APROVACAO (enum do Sequelize: enum_notificacoes_tipo).

const TIPO_NOTIFICACAO = "enum_notificacoes_tipo";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("categorias", "exigeAprovacao", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn("tickets", "aprovacaoStatus", {
      type: Sequelize.ENUM("NAO_EXIGIDA", "PENDENTE", "APROVADA", "REJEITADA"),
      allowNull: false,
      defaultValue: "NAO_EXIGIDA",
    });
    await queryInterface.addColumn("tickets", "aprovadorId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: "usuarios", key: "id" },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });
    await queryInterface.addColumn("tickets", "aprovacaoEm", { type: Sequelize.DATE, allowNull: true });
    await queryInterface.addColumn("tickets", "aprovacaoMotivo", { type: Sequelize.TEXT, allowNull: true });

    await queryInterface.sequelize.query(
      `ALTER TYPE "${TIPO_NOTIFICACAO}" ADD VALUE IF NOT EXISTS 'TICKET_APROVACAO' BEFORE 'SISTEMA';`
    );
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("tickets", "aprovacaoMotivo");
    await queryInterface.removeColumn("tickets", "aprovacaoEm");
    await queryInterface.removeColumn("tickets", "aprovadorId");
    await queryInterface.removeColumn("tickets", "aprovacaoStatus");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_tickets_aprovacaoStatus";');
    await queryInterface.removeColumn("categorias", "exigeAprovacao");

    // Postgres não remove valor de enum, então o tipo é recriado sem ele. As
    // notificações de aprovação são apagadas (o tipo deixa de existir).
    await queryInterface.sequelize.query(`DELETE FROM "notificacoes" WHERE "tipo" = 'TICKET_APROVACAO';`);
    await queryInterface.sequelize.query(`ALTER TYPE "${TIPO_NOTIFICACAO}" RENAME TO "${TIPO_NOTIFICACAO}_old";`);
    await queryInterface.sequelize.query(
      `CREATE TYPE "${TIPO_NOTIFICACAO}" AS ENUM ('TICKET_CRIADO', 'TICKET_ATRIBUIDO', 'TICKET_STATUS', 'TICKET_COMENTARIO', 'SISTEMA');`
    );
    await queryInterface.sequelize.query(`ALTER TABLE "notificacoes" ALTER COLUMN "tipo" DROP DEFAULT;`);
    await queryInterface.sequelize.query(
      `ALTER TABLE "notificacoes" ALTER COLUMN "tipo" TYPE "${TIPO_NOTIFICACAO}" USING "tipo"::text::"${TIPO_NOTIFICACAO}";`
    );
    await queryInterface.sequelize.query(`ALTER TABLE "notificacoes" ALTER COLUMN "tipo" SET DEFAULT 'SISTEMA';`);
    await queryInterface.sequelize.query(`DROP TYPE "${TIPO_NOTIFICACAO}_old";`);
  },
};
