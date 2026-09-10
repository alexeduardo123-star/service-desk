-- Script de criação das tabelas do Service Desk (PostgreSQL)
-- Uso: psql -U servicedesk_user -d servicedesk -f sql/schema.sql
-- Equivalente ao modelo definido em prisma/schema.prisma.

CREATE TYPE papel_usuario AS ENUM ('ADMIN', 'TECNICO', 'SOLICITANTE');
CREATE TYPE status_ticket AS ENUM ('ABERTO', 'EM_ANDAMENTO', 'FECHADO');

CREATE TABLE departamentos (
    id        SERIAL PRIMARY KEY,
    nome      VARCHAR(120) NOT NULL,
    descricao TEXT
);

CREATE TABLE usuarios (
    id              SERIAL PRIMARY KEY,
    nome            VARCHAR(120) NOT NULL,
    email           VARCHAR(160) NOT NULL UNIQUE,
    senha_hash      VARCHAR(255) NOT NULL,
    papel           papel_usuario NOT NULL DEFAULT 'SOLICITANTE',
    ativo           BOOLEAN NOT NULL DEFAULT TRUE,
    departamento_id INTEGER REFERENCES departamentos (id),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    reset_token_hash       TEXT,
    reset_token_expires_at TIMESTAMP,
    email_verificado             BOOLEAN NOT NULL DEFAULT TRUE,
    verificacao_token_hash       TEXT,
    verificacao_token_expires_at TIMESTAMP
);

CREATE TABLE categorias (
    id        SERIAL PRIMARY KEY,
    nome      VARCHAR(120) NOT NULL,
    descricao TEXT
);

CREATE TABLE prioridades (
    id        SERIAL PRIMARY KEY,
    nome      VARCHAR(60) NOT NULL,
    nivel     INTEGER NOT NULL,
    sla_horas INTEGER NOT NULL
);

CREATE TABLE equipamentos (
    id              SERIAL PRIMARY KEY,
    nome            VARCHAR(120) NOT NULL,
    tipo            VARCHAR(60) NOT NULL,
    numero_serie    VARCHAR(80) NOT NULL UNIQUE,
    usuario_id      INTEGER REFERENCES usuarios (id),
    departamento_id INTEGER REFERENCES departamentos (id)
);

CREATE TABLE tickets (
    id             SERIAL PRIMARY KEY,
    titulo         VARCHAR(160) NOT NULL,
    descricao      TEXT NOT NULL,
    status         status_ticket NOT NULL DEFAULT 'ABERTO',
    solicitante_id INTEGER NOT NULL REFERENCES usuarios (id),
    tecnico_id     INTEGER REFERENCES usuarios (id),
    categoria_id   INTEGER NOT NULL REFERENCES categorias (id),
    prioridade_id  INTEGER NOT NULL REFERENCES prioridades (id),
    equipamento_id INTEGER REFERENCES equipamentos (id),
    created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    closed_at      TIMESTAMP
);

CREATE TABLE comentarios (
    id         SERIAL PRIMARY KEY,
    ticket_id  INTEGER NOT NULL REFERENCES tickets (id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios (id),
    mensagem   TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE base_conhecimento (
    id           SERIAL PRIMARY KEY,
    titulo       VARCHAR(160) NOT NULL,
    conteudo     TEXT NOT NULL,
    categoria_id INTEGER REFERENCES categorias (id),
    autor_id     INTEGER NOT NULL REFERENCES usuarios (id),
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_solicitante ON tickets (solicitante_id);
CREATE INDEX idx_tickets_tecnico ON tickets (tecnico_id);
CREATE INDEX idx_tickets_status ON tickets (status);
CREATE INDEX idx_comentarios_ticket ON comentarios (ticket_id);
