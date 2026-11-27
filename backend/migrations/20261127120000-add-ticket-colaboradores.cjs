"use strict";

// Equivalente a prisma/migrations/20261127120000_add_ticket_colaboradores:
// tabela "ticket_colaboradores" (atendentes que ajudam no chamado sem ser o
// responsável).

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("ticket_colaboradores", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      ticketId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "tickets", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      usuarioId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "usuarios", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      adicionadoPorId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "usuarios", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      createdAt: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    });
    await queryInterface.addIndex("ticket_colaboradores", ["usuarioId"], { name: "ticket_colaboradores_usuarioId_idx" });
    await queryInterface.addIndex("ticket_colaboradores", ["ticketId", "usuarioId"], {
      name: "ticket_colaboradores_ticketId_usuarioId_key",
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("ticket_colaboradores");
  },
};
