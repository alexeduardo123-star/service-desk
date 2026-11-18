"use strict";

// Equivalente a prisma/migrations/20261118210000_add_departamento_ticket.
// Setor do chamado (na tela, "Departamento" aparece como "Setor"). Opcional:
// os chamados que já existem ficam sem setor.

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("tickets", "departamentoId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: "departamentos", key: "id" },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("tickets", "departamentoId");
  },
};
