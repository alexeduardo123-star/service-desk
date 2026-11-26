"use strict";

// Equivalente a prisma/migrations/20261122160000_add_prioridade_assunto_e_assunto_ticket.
//
// - assuntos.prioridadeId: prioridade que os chamados daquele assunto recebem.
// - tickets.assuntoId: assunto escolhido ao abrir o chamado.
// Ambas opcionais: os registros que já existem ficam sem valor.

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("assuntos", "prioridadeId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: "prioridades", key: "id" },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    });
    await queryInterface.addColumn("tickets", "assuntoId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: "assuntos", key: "id" },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });
    await queryInterface.addIndex("assuntos", ["prioridadeId"], { name: "assuntos_prioridadeId_idx" });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("tickets", "assuntoId");
    await queryInterface.removeIndex("assuntos", "assuntos_prioridadeId_idx");
    await queryInterface.removeColumn("assuntos", "prioridadeId");
  },
};
