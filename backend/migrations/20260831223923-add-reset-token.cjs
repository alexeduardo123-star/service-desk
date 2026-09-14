"use strict";

// Equivalente a prisma/migrations/20260831223923_add_reset_token.

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("usuarios", "resetTokenHash", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn("usuarios", "resetTokenExpiresAt", {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("usuarios", "resetTokenExpiresAt");
    await queryInterface.removeColumn("usuarios", "resetTokenHash");
  },
};
