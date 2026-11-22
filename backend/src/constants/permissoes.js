export const PERMISSOES = [
  { chave: "USUARIOS_GERENCIAR", nome: "Gerenciar usuários", grupo: "Administração", descricao: "Criar, editar, visualizar e excluir usuários." },
  { chave: "PERFIS_GERENCIAR", nome: "Gerenciar perfis e permissões", grupo: "Administração", descricao: "Configurar quais ações cada perfil pode executar." },
  { chave: "DEPARTAMENTOS_GERENCIAR", nome: "Gerenciar setores", grupo: "Cadastros", descricao: "Criar e editar setores/departamentos." },
  { chave: "CATEGORIAS_GERENCIAR", nome: "Gerenciar categorias", grupo: "Cadastros", descricao: "Manter categorias de chamados e artigos." },
  { chave: "PRIORIDADES_GERENCIAR", nome: "Gerenciar prioridades", grupo: "Cadastros", descricao: "Manter prioridades e prazos de SLA." },
  { chave: "SERVICOS_GERENCIAR", nome: "Gerenciar serviços", grupo: "Cadastros", descricao: "Manter o catálogo de serviços." },
  { chave: "ASSUNTOS_GERENCIAR", nome: "Gerenciar assuntos", grupo: "Cadastros", descricao: "Manter assuntos vinculados aos serviços." },
  { chave: "FORMULARIOS_GERENCIAR", nome: "Gerenciar formulários", grupo: "Cadastros", descricao: "Criar e editar formulários dos assuntos." },
  { chave: "EQUIPAMENTOS_ACESSAR", nome: "Acessar equipamentos", grupo: "Operação", descricao: "Visualizar, cadastrar e editar equipamentos." },
  { chave: "EQUIPAMENTOS_EXCLUIR", nome: "Excluir equipamentos", grupo: "Operação", descricao: "Excluir equipamentos cadastrados." },
  { chave: "FORNECEDORES_ACESSAR", nome: "Acessar fornecedores", grupo: "Operação", descricao: "Visualizar fornecedores cadastrados." },
  { chave: "FORNECEDORES_GERENCIAR", nome: "Gerenciar fornecedores", grupo: "Operação", descricao: "Criar, editar e excluir fornecedores." },
  { chave: "CONTRATOS_ACESSAR", nome: "Acessar contratos", grupo: "Operação", descricao: "Visualizar, cadastrar e editar contratos." },
  { chave: "CONTRATOS_EXCLUIR", nome: "Excluir contratos", grupo: "Operação", descricao: "Excluir contratos de manutenção." },
  { chave: "RELATORIOS_ACESSAR", nome: "Acessar relatórios", grupo: "Operação", descricao: "Visualizar relatórios e métricas." },
  { chave: "BASE_CONHECIMENTO_GERENCIAR", nome: "Gerenciar base de conhecimento", grupo: "Operação", descricao: "Criar, editar e excluir artigos." },
  { chave: "TICKETS_GERENCIAR", nome: "Gerenciar chamados", grupo: "Chamados", descricao: "Alterar status, suspender, retomar e atribuir chamados." },
  { chave: "TICKETS_EXCLUIR", nome: "Excluir chamados", grupo: "Chamados", descricao: "Excluir chamados do sistema." },
  { chave: "NOTIFICACOES_ENVIAR", nome: "Enviar comunicados", grupo: "Comunicação", descricao: "Criar comunicados para os usuários." },
];

export const PAPEIS = ["ADMIN", "GESTOR", "TECNICO", "SOLICITANTE"];

export const PERMISSOES_PADRAO = {
  ADMIN: PERMISSOES.map(({ chave }) => chave),
  GESTOR: ["RELATORIOS_ACESSAR", "TICKETS_GERENCIAR", "BASE_CONHECIMENTO_GERENCIAR", "EQUIPAMENTOS_ACESSAR", "CONTRATOS_ACESSAR", "FORNECEDORES_ACESSAR"],
  TECNICO: ["RELATORIOS_ACESSAR", "TICKETS_GERENCIAR", "BASE_CONHECIMENTO_GERENCIAR", "EQUIPAMENTOS_ACESSAR", "CONTRATOS_ACESSAR", "FORNECEDORES_ACESSAR"],
  SOLICITANTE: [],
};
