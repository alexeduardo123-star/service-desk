"use strict";

// Equivalente à migration "init" do Prisma (prisma/migrations/20260812224822_init).
// Mesmos nomes de tabela/coluna em camelCase, pra bater com o schema real do banco.

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("departamentos", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nome: { type: Sequelize.TEXT, allowNull: false },
      descricao: { type: Sequelize.TEXT, allowNull: true },
    });

    await queryInterface.createTable("usuarios", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nome: { type: Sequelize.TEXT, allowNull: false },
      email: { type: Sequelize.TEXT, allowNull: false, unique: true },
      senhaHash: { type: Sequelize.TEXT, allowNull: false },
      papel: {
        type: Sequelize.ENUM("ADMIN", "TECNICO", "SOLICITANTE"),
        allowNull: false,
        defaultValue: "SOLICITANTE",
      },
      ativo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      departamentoId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "departamentos", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    });

    await queryInterface.createTable("categorias", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nome: { type: Sequelize.TEXT, allowNull: false },
      descricao: { type: Sequelize.TEXT, allowNull: true },
    });

    await queryInterface.createTable("prioridades", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nome: { type: Sequelize.TEXT, allowNull: false },
      nivel: { type: Sequelize.INTEGER, allowNull: false },
      slaHoras: { type: Sequelize.INTEGER, allowNull: false },
    });

    await queryInterface.createTable("equipamentos", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nome: { type: Sequelize.TEXT, allowNull: false },
      tipo: { type: Sequelize.TEXT, allowNull: false },
      numeroSerie: { type: Sequelize.TEXT, allowNull: false, unique: true },
      usuarioId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "usuarios", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      departamentoId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "departamentos", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
    });

    await queryInterface.createTable("tickets", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      titulo: { type: Sequelize.TEXT, allowNull: false },
      descricao: { type: Sequelize.TEXT, allowNull: false },
      status: {
        type: Sequelize.ENUM("ABERTO", "EM_ANDAMENTO", "FECHADO"),
        allowNull: false,
        defaultValue: "ABERTO",
      },
      solicitanteId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "usuarios", key: "id" },
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
      tecnicoId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "usuarios", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      categoriaId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "categorias", key: "id" },
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
      prioridadeId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "prioridades", key: "id" },
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
      equipamentoId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "equipamentos", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      closedAt: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.createTable("comentarios", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
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
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
      mensagem: { type: Sequelize.TEXT, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    });

    await queryInterface.createTable("base_conhecimento", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      titulo: { type: Sequelize.TEXT, allowNull: false },
      conteudo: { type: Sequelize.TEXT, allowNull: false },
      categoriaId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "categorias", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      autorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "usuarios", key: "id" },
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addIndex("tickets", ["solicitanteId"], { name: "idx_tickets_solicitante" });
    await queryInterface.addIndex("tickets", ["tecnicoId"], { name: "idx_tickets_tecnico" });
    await queryInterface.addIndex("tickets", ["status"], { name: "idx_tickets_status" });
    await queryInterface.addIndex("comentarios", ["ticketId"], { name: "idx_comentarios_ticket" });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("base_conhecimento");
    await queryInterface.dropTable("comentarios");
    await queryInterface.dropTable("tickets");
    await queryInterface.dropTable("equipamentos");
    await queryInterface.dropTable("prioridades");
    await queryInterface.dropTable("categorias");
    await queryInterface.dropTable("usuarios");
    await queryInterface.dropTable("departamentos");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_tickets_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_usuarios_papel";');
  },
};
