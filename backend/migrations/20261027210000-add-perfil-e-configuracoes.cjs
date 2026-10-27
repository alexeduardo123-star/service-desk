"use strict";

// Equivalente a prisma/migrations/20261027210000_add_perfil_e_configuracoes.

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("usuarios", "telefone", { type: Sequelize.TEXT, allowNull: true });
    await queryInterface.addColumn("usuarios", "cargo", { type: Sequelize.TEXT, allowNull: true });

    await queryInterface.createTable("configuracoes_usuario", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      usuarioId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: "usuarios", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      itensPorPagina: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 10 },
      fusoHorario: { type: Sequelize.TEXT, allowNull: false, defaultValue: "America/Sao_Paulo" },
      notificarEmail: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      notificarNovoTicket: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      notificarAtribuicao: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      notificarStatus: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      notificarComentario: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("configuracoes_usuario");
    await queryInterface.removeColumn("usuarios", "cargo");
    await queryInterface.removeColumn("usuarios", "telefone");
  },
};
