-- CreateTable
CREATE TABLE "permissoes" (
  "id" SERIAL NOT NULL,
  "chave" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "grupo" TEXT NOT NULL,
  "descricao" TEXT,
  CONSTRAINT "permissoes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "permissoes_chave_key" ON "permissoes"("chave");

CREATE TABLE "perfis_permissoes" (
  "id" SERIAL NOT NULL,
  "papel" "PapelUsuario" NOT NULL,
  "permissaoId" INTEGER NOT NULL,
  CONSTRAINT "perfis_permissoes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "perfis_permissoes_permissaoId_fkey" FOREIGN KEY ("permissaoId") REFERENCES "permissoes"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "perfis_permissoes_papel_permissaoId_key" ON "perfis_permissoes"("papel", "permissaoId");
CREATE INDEX "perfis_permissoes_papel_idx" ON "perfis_permissoes"("papel");

INSERT INTO "permissoes" ("chave", "nome", "grupo", "descricao") VALUES ('USUARIOS_GERENCIAR', 'Gerenciar usuários', 'Administração', 'Criar, editar, visualizar e excluir usuários.');
INSERT INTO "permissoes" ("chave", "nome", "grupo", "descricao") VALUES ('PERFIS_GERENCIAR', 'Gerenciar perfis e permissões', 'Administração', 'Configurar quais ações cada perfil pode executar.');
INSERT INTO "permissoes" ("chave", "nome", "grupo", "descricao") VALUES ('DEPARTAMENTOS_GERENCIAR', 'Gerenciar setores', 'Cadastros', 'Criar e editar setores/departamentos.');
INSERT INTO "permissoes" ("chave", "nome", "grupo", "descricao") VALUES ('CATEGORIAS_GERENCIAR', 'Gerenciar categorias', 'Cadastros', 'Manter categorias de chamados e artigos.');
INSERT INTO "permissoes" ("chave", "nome", "grupo", "descricao") VALUES ('PRIORIDADES_GERENCIAR', 'Gerenciar prioridades', 'Cadastros', 'Manter prioridades e prazos de SLA.');
INSERT INTO "permissoes" ("chave", "nome", "grupo", "descricao") VALUES ('SERVICOS_GERENCIAR', 'Gerenciar serviços', 'Cadastros', 'Manter o catálogo de serviços.');
INSERT INTO "permissoes" ("chave", "nome", "grupo", "descricao") VALUES ('ASSUNTOS_GERENCIAR', 'Gerenciar assuntos', 'Cadastros', 'Manter assuntos vinculados aos serviços.');
INSERT INTO "permissoes" ("chave", "nome", "grupo", "descricao") VALUES ('FORMULARIOS_GERENCIAR', 'Gerenciar formulários', 'Cadastros', 'Criar e editar formulários dos assuntos.');
INSERT INTO "permissoes" ("chave", "nome", "grupo", "descricao") VALUES ('EQUIPAMENTOS_ACESSAR', 'Acessar equipamentos', 'Operação', 'Visualizar, cadastrar e editar equipamentos.');
INSERT INTO "permissoes" ("chave", "nome", "grupo", "descricao") VALUES ('EQUIPAMENTOS_EXCLUIR', 'Excluir equipamentos', 'Operação', 'Excluir equipamentos cadastrados.');
INSERT INTO "permissoes" ("chave", "nome", "grupo", "descricao") VALUES ('FORNECEDORES_ACESSAR', 'Acessar fornecedores', 'Operação', 'Visualizar fornecedores cadastrados.');
INSERT INTO "permissoes" ("chave", "nome", "grupo", "descricao") VALUES ('FORNECEDORES_GERENCIAR', 'Gerenciar fornecedores', 'Operação', 'Criar, editar e excluir fornecedores.');
INSERT INTO "permissoes" ("chave", "nome", "grupo", "descricao") VALUES ('CONTRATOS_ACESSAR', 'Acessar contratos', 'Operação', 'Visualizar, cadastrar e editar contratos.');
INSERT INTO "permissoes" ("chave", "nome", "grupo", "descricao") VALUES ('CONTRATOS_EXCLUIR', 'Excluir contratos', 'Operação', 'Excluir contratos de manutenção.');
INSERT INTO "permissoes" ("chave", "nome", "grupo", "descricao") VALUES ('RELATORIOS_ACESSAR', 'Acessar relatórios', 'Operação', 'Visualizar relatórios e métricas.');
INSERT INTO "permissoes" ("chave", "nome", "grupo", "descricao") VALUES ('BASE_CONHECIMENTO_GERENCIAR', 'Gerenciar base de conhecimento', 'Operação', 'Criar, editar e excluir artigos.');
INSERT INTO "permissoes" ("chave", "nome", "grupo", "descricao") VALUES ('TICKETS_GERENCIAR', 'Gerenciar chamados', 'Chamados', 'Alterar status, suspender, retomar e atribuir chamados.');
INSERT INTO "permissoes" ("chave", "nome", "grupo", "descricao") VALUES ('TICKETS_EXCLUIR', 'Excluir chamados', 'Chamados', 'Excluir chamados do sistema.');
INSERT INTO "permissoes" ("chave", "nome", "grupo", "descricao") VALUES ('NOTIFICACOES_ENVIAR', 'Enviar comunicados', 'Comunicação', 'Criar comunicados para os usuários.');

-- Preserva os acessos atuais e adiciona o perfil Gestor com permissões operacionais iniciais.
INSERT INTO "perfis_permissoes" ("papel", "permissaoId") SELECT 'ADMIN', "id" FROM "permissoes" WHERE "chave" = 'USUARIOS_GERENCIAR';
INSERT INTO "perfis_permissoes" ("papel", "permissaoId") SELECT 'ADMIN', "id" FROM "permissoes" WHERE "chave" = 'PERFIS_GERENCIAR';
INSERT INTO "perfis_permissoes" ("papel", "permissaoId") SELECT 'ADMIN', "id" FROM "permissoes" WHERE "chave" = 'DEPARTAMENTOS_GERENCIAR';
INSERT INTO "perfis_permissoes" ("papel", "permissaoId") SELECT 'ADMIN', "id" FROM "permissoes" WHERE "chave" = 'CATEGORIAS_GERENCIAR';
INSERT INTO "perfis_permissoes" ("papel", "permissaoId") SELECT 'ADMIN', "id" FROM "permissoes" WHERE "chave" = 'PRIORIDADES_GERENCIAR';
INSERT INTO "perfis_permissoes" ("papel", "permissaoId") SELECT 'ADMIN', "id" FROM "permissoes" WHERE "chave" = 'SERVICOS_GERENCIAR';
INSERT INTO "perfis_permissoes" ("papel", "permissaoId") SELECT 'ADMIN', "id" FROM "permissoes" WHERE "chave" = 'ASSUNTOS_GERENCIAR';
INSERT INTO "perfis_permissoes" ("papel", "permissaoId") SELECT 'ADMIN', "id" FROM "permissoes" WHERE "chave" = 'FORMULARIOS_GERENCIAR';
INSERT INTO "perfis_permissoes" ("papel", "permissaoId") SELECT 'ADMIN', "id" FROM "permissoes" WHERE "chave" = 'EQUIPAMENTOS_ACESSAR';
INSERT INTO "perfis_permissoes" ("papel", "permissaoId") SELECT 'ADMIN', "id" FROM "permissoes" WHERE "chave" = 'EQUIPAMENTOS_EXCLUIR';
INSERT INTO "perfis_permissoes" ("papel", "permissaoId") SELECT 'ADMIN', "id" FROM "permissoes" WHERE "chave" = 'FORNECEDORES_ACESSAR';
INSERT INTO "perfis_permissoes" ("papel", "permissaoId") SELECT 'ADMIN', "id" FROM "permissoes" WHERE "chave" = 'FORNECEDORES_GERENCIAR';
INSERT INTO "perfis_permissoes" ("papel", "permissaoId") SELECT 'ADMIN', "id" FROM "permissoes" WHERE "chave" = 'CONTRATOS_ACESSAR';
INSERT INTO "perfis_permissoes" ("papel", "permissaoId") SELECT 'ADMIN', "id" FROM "permissoes" WHERE "chave" = 'CONTRATOS_EXCLUIR';
INSERT INTO "perfis_permissoes" ("papel", "permissaoId") SELECT 'ADMIN', "id" FROM "permissoes" WHERE "chave" = 'RELATORIOS_ACESSAR';
INSERT INTO "perfis_permissoes" ("papel", "permissaoId") SELECT 'ADMIN', "id" FROM "permissoes" WHERE "chave" = 'BASE_CONHECIMENTO_GERENCIAR';
INSERT INTO "perfis_permissoes" ("papel", "permissaoId") SELECT 'ADMIN', "id" FROM "permissoes" WHERE "chave" = 'TICKETS_GERENCIAR';
INSERT INTO "perfis_permissoes" ("papel", "permissaoId") SELECT 'ADMIN', "id" FROM "permissoes" WHERE "chave" = 'TICKETS_EXCLUIR';
INSERT INTO "perfis_permissoes" ("papel", "permissaoId") SELECT 'ADMIN', "id" FROM "permissoes" WHERE "chave" = 'NOTIFICACOES_ENVIAR';
INSERT INTO "perfis_permissoes" ("papel", "permissaoId") SELECT 'GESTOR', "id" FROM "permissoes" WHERE "chave" = 'RELATORIOS_ACESSAR';
INSERT INTO "perfis_permissoes" ("papel", "permissaoId") SELECT 'GESTOR', "id" FROM "permissoes" WHERE "chave" = 'TICKETS_GERENCIAR';
INSERT INTO "perfis_permissoes" ("papel", "permissaoId") SELECT 'GESTOR', "id" FROM "permissoes" WHERE "chave" = 'BASE_CONHECIMENTO_GERENCIAR';
INSERT INTO "perfis_permissoes" ("papel", "permissaoId") SELECT 'GESTOR', "id" FROM "permissoes" WHERE "chave" = 'EQUIPAMENTOS_ACESSAR';
INSERT INTO "perfis_permissoes" ("papel", "permissaoId") SELECT 'GESTOR', "id" FROM "permissoes" WHERE "chave" = 'CONTRATOS_ACESSAR';
INSERT INTO "perfis_permissoes" ("papel", "permissaoId") SELECT 'GESTOR', "id" FROM "permissoes" WHERE "chave" = 'FORNECEDORES_ACESSAR';
INSERT INTO "perfis_permissoes" ("papel", "permissaoId") SELECT 'TECNICO', "id" FROM "permissoes" WHERE "chave" = 'RELATORIOS_ACESSAR';
INSERT INTO "perfis_permissoes" ("papel", "permissaoId") SELECT 'TECNICO', "id" FROM "permissoes" WHERE "chave" = 'TICKETS_GERENCIAR';
INSERT INTO "perfis_permissoes" ("papel", "permissaoId") SELECT 'TECNICO', "id" FROM "permissoes" WHERE "chave" = 'BASE_CONHECIMENTO_GERENCIAR';
INSERT INTO "perfis_permissoes" ("papel", "permissaoId") SELECT 'TECNICO', "id" FROM "permissoes" WHERE "chave" = 'EQUIPAMENTOS_ACESSAR';
INSERT INTO "perfis_permissoes" ("papel", "permissaoId") SELECT 'TECNICO', "id" FROM "permissoes" WHERE "chave" = 'CONTRATOS_ACESSAR';
INSERT INTO "perfis_permissoes" ("papel", "permissaoId") SELECT 'TECNICO', "id" FROM "permissoes" WHERE "chave" = 'FORNECEDORES_ACESSAR';

