-- Script de criação das tabelas do Service Desk (PostgreSQL)
-- Uso: psql -U servicedesk_user -d servicedesk -f sql/schema.sql
--
-- Equivalente ao que "npx prisma migrate dev" gera a partir de
-- prisma/schema.prisma (nomes de tabela/coluna em camelCase entre aspas,
-- exatamente como o Prisma Client espera — sem @map nos campos). Sempre que
-- prisma/schema.prisma mudar, regenere este arquivo a partir das migrations
-- em prisma/migrations/ para os dois ficarem equivalentes de fato.

CREATE TYPE "PapelUsuario" AS ENUM ('ADMIN', 'TECNICO', 'GESTOR', 'SOLICITANTE');
CREATE TYPE "StatusTicket" AS ENUM ('ABERTO', 'EM_ANDAMENTO', 'AGUARDANDO_USUARIO', 'SUSPENSO', 'FECHADO');
CREATE TYPE "TipoNotificacao" AS ENUM ('TICKET_CRIADO', 'TICKET_ATRIBUIDO', 'TICKET_STATUS', 'TICKET_COMENTARIO', 'TICKET_APROVACAO', 'TICKET_ENCAMINHADO', 'TICKET_COLABORADOR', 'SISTEMA');
CREATE TYPE "StatusAprovacao" AS ENUM ('NAO_EXIGIDA', 'PENDENTE', 'APROVADA', 'REJEITADA');
CREATE TYPE "TipoCampoFormulario" AS ENUM ('TEXTO', 'TEXTO_LONGO', 'NUMERO', 'DATA', 'SELECAO', 'CHECKBOX');

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
    "telefone"                    TEXT,
    "cargo"                       TEXT,
    "departamentoId"              INTEGER REFERENCES "departamentos" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "createdAt"                   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resetTokenHash"              TEXT,
    "resetTokenExpiresAt"         TIMESTAMP(3),
    "emailVerificado"             BOOLEAN NOT NULL DEFAULT TRUE,
    "verificacaoTokenHash"        TEXT,
    "verificacaoTokenExpiresAt"   TIMESTAMP(3)
);

CREATE TABLE "perfil_permissoes" (
    "id"         SERIAL PRIMARY KEY,
    "papel"      "PapelUsuario" NOT NULL,
    "permissao"  TEXT NOT NULL,
    "concedida"  BOOLEAN NOT NULL,
    "updatedAt"  TIMESTAMP(3) NOT NULL,
    UNIQUE ("papel", "permissao")
);

CREATE TABLE "categorias" (
    "id"        SERIAL PRIMARY KEY,
    "nome"      TEXT NOT NULL,
    "descricao" TEXT,
    "exigeAprovacao" BOOLEAN NOT NULL DEFAULT FALSE
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
    "closedAt"       TIMESTAMP(3),
    "departamentoId" INTEGER REFERENCES "departamentos" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "assuntoId"      INTEGER,  -- FK para assuntos adicionada depois da criação de "assuntos"
    "aprovacaoStatus" "StatusAprovacao" NOT NULL DEFAULT 'NAO_EXIGIDA',
    "aprovadorId"    INTEGER REFERENCES "usuarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "aprovacaoEm"    TIMESTAMP(3),
    "aprovacaoMotivo" TEXT,
    "respostasFormulario" JSONB
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

CREATE TABLE "configuracoes_usuario" (
    "id"                   SERIAL PRIMARY KEY,
    "usuarioId"            INTEGER NOT NULL UNIQUE REFERENCES "usuarios" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "itensPorPagina"       INTEGER NOT NULL DEFAULT 10,
    "fusoHorario"          TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "notificarEmail"       BOOLEAN NOT NULL DEFAULT FALSE,
    "notificarNovoTicket"  BOOLEAN NOT NULL DEFAULT TRUE,
    "notificarAtribuicao"  BOOLEAN NOT NULL DEFAULT TRUE,
    "notificarStatus"      BOOLEAN NOT NULL DEFAULT TRUE,
    "notificarComentario"  BOOLEAN NOT NULL DEFAULT TRUE,
    "updatedAt"            TIMESTAMP(3) NOT NULL
);

CREATE TABLE "notificacoes" (
    "id"         SERIAL PRIMARY KEY,
    "usuarioId"  INTEGER NOT NULL REFERENCES "usuarios" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "tipo"       "TipoNotificacao" NOT NULL DEFAULT 'SISTEMA',
    "titulo"     TEXT NOT NULL,
    "mensagem"   TEXT NOT NULL,
    "ticketId"   INTEGER REFERENCES "tickets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "lida"       BOOLEAN NOT NULL DEFAULT FALSE,
    "lidaEm"     TIMESTAMP(3),
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "relatorios_salvos" (
    "id"         SERIAL PRIMARY KEY,
    "nome"       TEXT NOT NULL,
    "descricao"  TEXT,
    "filtros"    JSONB NOT NULL,
    "usuarioId"  INTEGER NOT NULL REFERENCES "usuarios" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL
);

CREATE TABLE "servicos" (
    "id"         SERIAL PRIMARY KEY,
    "nome"       TEXT NOT NULL UNIQUE,
    "descricao"  TEXT,
    "ativo"      BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL
);

CREATE TABLE "formularios" (
    "id"         SERIAL PRIMARY KEY,
    "nome"       TEXT NOT NULL UNIQUE,
    "descricao"  TEXT,
    "ativo"      BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL
);

CREATE TABLE "formulario_campos" (
    "id"            SERIAL PRIMARY KEY,
    "formularioId"  INTEGER NOT NULL REFERENCES "formularios" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "rotulo"        TEXT NOT NULL,
    "tipo"          "TipoCampoFormulario" NOT NULL DEFAULT 'TEXTO',
    "obrigatorio"   BOOLEAN NOT NULL DEFAULT FALSE,
    "opcoes"        TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ordem"         INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE "assuntos" (
    "id"            SERIAL PRIMARY KEY,
    "nome"          TEXT NOT NULL,
    "descricao"     TEXT,
    "ativo"         BOOLEAN NOT NULL DEFAULT TRUE,
    "servicoId"     INTEGER NOT NULL REFERENCES "servicos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "formularioId"  INTEGER REFERENCES "formularios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "prioridadeId"  INTEGER REFERENCES "prioridades" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "responsavelId" INTEGER REFERENCES "usuarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,
    UNIQUE ("servicoId", "nome")
);

ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assuntoId_fkey"
    FOREIGN KEY ("assuntoId") REFERENCES "assuntos" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "agendamentos" (
    "id"           SERIAL PRIMARY KEY,
    "titulo"       TEXT NOT NULL,
    "descricao"    TEXT,
    "inicio"       TIMESTAMP(3) NOT NULL,
    "fim"          TIMESTAMP(3) NOT NULL,
    "atendenteId"  INTEGER NOT NULL REFERENCES "usuarios" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "criadoPorId"  INTEGER REFERENCES "usuarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "ticketId"     INTEGER REFERENCES "tickets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL
);

-- Atendentes que ajudam no chamado sem ser o responsável ("tecnicoId").
CREATE TABLE "ticket_colaboradores" (
    "id"              SERIAL PRIMARY KEY,
    "ticketId"        INTEGER NOT NULL REFERENCES "tickets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "usuarioId"       INTEGER NOT NULL REFERENCES "usuarios" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "adicionadoPorId" INTEGER REFERENCES "usuarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE ("ticketId", "usuarioId")
);

CREATE INDEX "idx_tickets_solicitante" ON "tickets" ("solicitanteId");
CREATE INDEX "idx_tickets_tecnico" ON "tickets" ("tecnicoId");
CREATE INDEX "idx_tickets_status" ON "tickets" ("status");
CREATE INDEX "idx_comentarios_ticket" ON "comentarios" ("ticketId");
CREATE INDEX "idx_notificacoes_usuario_lida" ON "notificacoes" ("usuarioId", "lida");
CREATE INDEX "idx_relatorios_salvos_usuario" ON "relatorios_salvos" ("usuarioId");
CREATE INDEX "idx_formulario_campos_formulario" ON "formulario_campos" ("formularioId");
CREATE INDEX "idx_assuntos_formulario" ON "assuntos" ("formularioId");
CREATE INDEX "idx_assuntos_prioridade" ON "assuntos" ("prioridadeId");
CREATE INDEX "idx_assuntos_responsavel" ON "assuntos" ("responsavelId");
CREATE INDEX "idx_tickets_assunto" ON "tickets" ("assuntoId");
CREATE INDEX "idx_agendamentos_atendente_inicio" ON "agendamentos" ("atendenteId", "inicio");
CREATE INDEX "idx_agendamentos_ticket" ON "agendamentos" ("ticketId");
CREATE INDEX "idx_ticket_colaboradores_usuario" ON "ticket_colaboradores" ("usuarioId");
