"use strict";

// Equivalente a prisma/migrations/20261122180000_add_respostas_formulario_ticket.
// Respostas do formulário do assunto, guardadas no próprio chamado.

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("tickets", "respostasFormulario", {
      type: Sequelize.JSONB,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("tickets", "respostasFormulario");
  },
};
