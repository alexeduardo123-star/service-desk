"use strict";

// Equivalente a prisma/migrations/20260831201500_add_email_verification.

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("usuarios", "emailVerificado", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
    await queryInterface.addColumn("usuarios", "verificacaoTokenHash", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn("usuarios", "verificacaoTokenExpiresAt", {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("usuarios", "verificacaoTokenExpiresAt");
    await queryInterface.removeColumn("usuarios", "verificacaoTokenHash");
    await queryInterface.removeColumn("usuarios", "emailVerificado");
  },
};
