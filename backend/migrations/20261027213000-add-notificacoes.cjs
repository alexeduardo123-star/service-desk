"use strict";

// Equivalente a prisma/migrations/20261027213000_add_notificacoes.

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("notificacoes", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      usuarioId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "usuarios", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      tipo: {
        type: Sequelize.ENUM("TICKET_CRIADO", "TICKET_ATRIBUIDO", "TICKET_STATUS", "TICKET_COMENTARIO", "SISTEMA"),
        allowNull: false,
        defaultValue: "SISTEMA",
      },
      titulo: { type: Sequelize.TEXT, allowNull: false },
      mensagem: { type: Sequelize.TEXT, allowNull: false },
      ticketId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "tickets", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      lida: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      lidaEm: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    });

    await queryInterface.addIndex("notificacoes", ["usuarioId", "lida"], { name: "notificacoes_usuarioId_lida_idx" });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("notificacoes");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_notificacoes_tipo";');
  },
};
