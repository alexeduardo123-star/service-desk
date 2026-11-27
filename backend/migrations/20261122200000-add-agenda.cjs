"use strict";

// Equivalente a prisma/migrations/20261122200000_add_agenda: tabela
// "agendamentos" (atendimentos agendados por atendente).

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("agendamentos", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      titulo: { type: Sequelize.TEXT, allowNull: false },
      descricao: { type: Sequelize.TEXT, allowNull: true },
      inicio: { type: Sequelize.DATE(3), allowNull: false },
      fim: { type: Sequelize.DATE(3), allowNull: false },
      atendenteId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "usuarios", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      criadoPorId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "usuarios", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      ticketId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "tickets", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      createdAt: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: Sequelize.DATE(3), allowNull: false },
    });
    await queryInterface.addIndex("agendamentos", ["atendenteId", "inicio"], { name: "agendamentos_atendenteId_inicio_idx" });
    await queryInterface.addIndex("agendamentos", ["ticketId"], { name: "agendamentos_ticketId_idx" });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("agendamentos");
  },
};
