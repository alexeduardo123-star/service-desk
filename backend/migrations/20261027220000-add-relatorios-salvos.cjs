"use strict";

// Equivalente a prisma/migrations/20261027220000_add_relatorios_salvos.

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("relatorios_salvos", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nome: { type: Sequelize.TEXT, allowNull: false },
      descricao: { type: Sequelize.TEXT, allowNull: true },
      filtros: { type: Sequelize.JSONB, allowNull: false },
      usuarioId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "usuarios", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex("relatorios_salvos", ["usuarioId"], { name: "relatorios_salvos_usuarioId_idx" });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("relatorios_salvos");
  },
};
