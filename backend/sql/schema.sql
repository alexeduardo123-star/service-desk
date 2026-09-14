-- Script de criação das tabelas do Service Desk (PostgreSQL)
-- Uso: psql -U servicedesk_user -d servicedesk -f sql/schema.sql
--
-- Equivalente ao que "npx prisma migrate dev" gera a partir de
-- prisma/schema.prisma (nomes de tabela/coluna em camelCase entre aspas,
-- exatamente como o Prisma Client espera — sem @map nos campos). Sempre que
-- prisma/schema.prisma mudar, regenere este arquivo a partir das migrations
-- em prisma/migrations/ para os dois ficarem equivalentes de fato.

CREATE TYPE "PapelUsuario" AS ENUM ('ADMIN', 'TECNICO', 'SOLICITANTE');
CREATE TYPE "StatusTicket" AS ENUM ('ABERTO', 'EM_ANDAMENTO', 'FECHADO');

CREATE TABLE "departamentos" (
    "id"        SERIAL PRIMARY KEY,
    "nome"      TEXT NOT NULL,
    "descricao" TEXT
);

CREATE TABLE "usuarios" (
    "id"                          SERIAL PRIMARY KEY,
    "nome"                        TEXT NOT NULL,
    "email"                       TEXT NOT NULL UNIQUE,
    "senhaHash"                   TEXT NOT NULL,
    "papel"                       "PapelUsuario" NOT NULL DEFAULT 'SOLICITANTE',
    "ativo"                       BOOLEAN NOT NULL DEFAULT TRUE,
    "departamentoId"              INTEGER REFERENCES "departamentos" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "createdAt"                   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resetTokenHash"              TEXT,
    "resetTokenExpiresAt"         TIMESTAMP(3),
    "emailVerificado"             BOOLEAN NOT NULL DEFAULT TRUE,
    "verificacaoTokenHash"        TEXT,
    "verificacaoTokenExpiresAt"   TIMESTAMP(3)
);

CREATE TABLE "categorias" (
    "id"        SERIAL PRIMARY KEY,
    "nome"      TEXT NOT NULL,
    "descricao" TEXT
);

CREATE TABLE "prioridades" (
    "id"        SERIAL PRIMARY KEY,
    "nome"      TEXT NOT NULL,
    "nivel"     INTEGER NOT NULL,
    "slaHoras"  INTEGER NOT NULL
);

CREATE TABLE "equipamentos" (
    "id"              SERIAL PRIMARY KEY,
    "nome"            TEXT NOT NULL,
    "tipo"            TEXT NOT NULL,
    "numeroSerie"     TEXT NOT NULL UNIQUE,
    "usuarioId"       INTEGER REFERENCES "usuarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "departamentoId"  INTEGER REFERENCES "departamentos" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "tickets" (
    "id"             SERIAL PRIMARY KEY,
    "titulo"         TEXT NOT NULL,
    "descricao"      TEXT NOT NULL,
    "status"         "StatusTicket" NOT NULL DEFAULT 'ABERTO',
    "solicitanteId"  INTEGER NOT NULL REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "tecnicoId"      INTEGER REFERENCES "usuarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "categoriaId"    INTEGER NOT NULL REFERENCES "categorias" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "prioridadeId"   INTEGER NOT NULL REFERENCES "prioridades" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "equipamentoId"  INTEGER REFERENCES "equipamentos" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,
    "closedAt"       TIMESTAMP(3)
);

CREATE TABLE "comentarios" (
    "id"         SERIAL PRIMARY KEY,
    "ticketId"   INTEGER NOT NULL REFERENCES "tickets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "usuarioId"  INTEGER NOT NULL REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "mensagem"   TEXT NOT NULL,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "base_conhecimento" (
    "id"           SERIAL PRIMARY KEY,
    "titulo"       TEXT NOT NULL,
    "conteudo"     TEXT NOT NULL,
    "categoriaId"  INTEGER REFERENCES "categorias" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "autorId"      INTEGER NOT NULL REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL
);

CREATE INDEX "idx_tickets_solicitante" ON "tickets" ("solicitanteId");
CREATE INDEX "idx_tickets_tecnico" ON "tickets" ("tecnicoId");
CREATE INDEX "idx_tickets_status" ON "tickets" ("status");
CREATE INDEX "idx_comentarios_ticket" ON "comentarios" ("ticketId");
