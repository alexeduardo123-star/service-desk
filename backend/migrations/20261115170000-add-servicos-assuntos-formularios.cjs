"use strict";

// Equivalente a prisma/migrations/20261115170000_add_servicos_assuntos_formularios.

const timestamps = (Sequelize) => ({
  createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
  updatedAt: { type: Sequelize.DATE, allowNull: false },
});

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("servicos", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nome: { type: Sequelize.TEXT, allowNull: false, unique: true },
      descricao: { type: Sequelize.TEXT, allowNull: true },
      ativo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      ...timestamps(Sequelize),
    });

    await queryInterface.createTable("formularios", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nome: { type: Sequelize.TEXT, allowNull: false, unique: true },
      descricao: { type: Sequelize.TEXT, allowNull: true },
      ativo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      ...timestamps(Sequelize),
    });

    await queryInterface.createTable("formulario_campos", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      formularioId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "formularios", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      rotulo: { type: Sequelize.TEXT, allowNull: false },
      tipo: {
        type: Sequelize.ENUM("TEXTO", "TEXTO_LONGO", "NUMERO", "DATA", "SELECAO", "CHECKBOX"),
        allowNull: false,
        defaultValue: "TEXTO",
      },
      obrigatorio: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      opcoes: { type: Sequelize.ARRAY(Sequelize.TEXT), allowNull: true, defaultValue: [] },
      ordem: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
    });
    await queryInterface.addIndex("formulario_campos", ["formularioId"], { name: "formulario_campos_formularioId_idx" });

    await queryInterface.createTable("assuntos", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nome: { type: Sequelize.TEXT, allowNull: false },
      descricao: { type: Sequelize.TEXT, allowNull: true },
      ativo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      servicoId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "servicos", key: "id" },
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
      formularioId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "formularios", key: "id" },
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
      ...timestamps(Sequelize),
    });
    await queryInterface.addIndex("assuntos", ["servicoId", "nome"], { unique: true, name: "assuntos_servicoId_nome_key" });
    await queryInterface.addIndex("assuntos", ["formularioId"], { name: "assuntos_formularioId_idx" });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("assuntos");
    await queryInterface.dropTable("formulario_campos");
    await queryInterface.dropTable("formularios");
    await queryInterface.dropTable("servicos");
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_formulario_campos_tipo";`);
  },
};
