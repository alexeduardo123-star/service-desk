// Catálogo de permissões do sistema e regras para resolver o que cada perfil
// (papel) pode fazer.
//
// Os valores padrão ficam aqui, no código. O administrador pode liberar ou
// bloquear uma permissão para um perfil na tela "Perfis e permissões"; esses
// ajustes vão para a tabela perfil_permissoes e valem por cima do padrão.
// ADMIN sempre tem tudo e não pode ser alterado (evita se trancar fora).

export const PAPEIS = ["ADMIN", "TECNICO", "GESTOR", "SOLICITANTE"];

export const PERMISSOES = {
  "usuarios.gerenciar": {
    rotulo: "Gerenciar usuários",
    grupo: "Administração",
    padrao: [],
  },
  "permissoes.gerenciar": {
    rotulo: "Gerenciar perfis e permissões",
    grupo: "Administração",
    padrao: [],
  },
  "cadastros.gerenciar": {
    rotulo: "Gerenciar cadastros (setores, categorias, prioridades, serviços, assuntos e formulários)",
    grupo: "Administração",
    padrao: [],
  },
  "notificacoes.enviar": {
    rotulo: "Enviar comunicados",
    grupo: "Administração",
    padrao: [],
  },
  "tickets.tratar": {
    rotulo: "Tratar chamados (status, suspender, retomar e atribuir)",
    grupo: "Chamados",
    padrao: ["TECNICO", "GESTOR"],
  },
  "tickets.aprovar": {
    rotulo: "Aprovar ou rejeitar chamados do próprio setor",
    grupo: "Chamados",
    padrao: ["GESTOR"],
  },
  "tickets.excluir": {
    rotulo: "Excluir chamados",
    grupo: "Chamados",
    padrao: [],
  },
  "relatorios.ver": {
    rotulo: "Ver relatórios",
    grupo: "Relatórios",
    padrao: ["TECNICO", "GESTOR"],
  },
  "base.gerenciar": {
    rotulo: "Escrever na base de conhecimento",
    grupo: "Base de conhecimento",
    padrao: ["TECNICO", "GESTOR"],
  },
  "equipamentos.gerenciar": {
    rotulo: "Cadastrar e editar equipamentos",
    grupo: "Ativos e contratos",
    padrao: ["TECNICO"],
  },
  "equipamentos.excluir": {
    rotulo: "Excluir equipamentos",
    grupo: "Ativos e contratos",
    padrao: [],
  },
  "fornecedores.ver": {
    rotulo: "Ver fornecedores",
    grupo: "Ativos e contratos",
    padrao: ["TECNICO", "GESTOR"],
  },
  "fornecedores.gerenciar": {
    rotulo: "Cadastrar, editar e excluir fornecedores",
    grupo: "Ativos e contratos",
    padrao: [],
  },
  "contratos.ver": {
    rotulo: "Ver contratos de manutenção",
    grupo: "Ativos e contratos",
    padrao: ["TECNICO", "GESTOR"],
  },
  "contratos.gerenciar": {
    rotulo: "Cadastrar e editar contratos de manutenção",
    grupo: "Ativos e contratos",
    padrao: ["TECNICO"],
  },
  "contratos.excluir": {
    rotulo: "Excluir contratos de manutenção",
    grupo: "Ativos e contratos",
    padrao: [],
  },
};

export const CHAVES_PERMISSAO = Object.keys(PERMISSOES);

export function permissaoExiste(chave) {
  return Object.hasOwn(PERMISSOES, chave);
}

export function papelValido(papel) {
  return PAPEIS.includes(papel);
}

// Valor padrão (sem ajustes do administrador) de uma permissão para um papel.
export function concedidaPorPadrao(papel, chave) {
  if (papel === "ADMIN") return true;
  return Boolean(PERMISSOES[chave]?.padrao.includes(papel));
}

// overrides: [{ papel, permissao, concedida }] vindos do banco.
export function papelTemPermissao(papel, chave, overrides = []) {
  if (!papelValido(papel) || !permissaoExiste(chave)) return false;
  if (papel === "ADMIN") return true;
  const ajuste = overrides.find((o) => o.papel === papel && o.permissao === chave);
  return ajuste ? ajuste.concedida : concedidaPorPadrao(papel, chave);
}

export function permissoesDoPapel(papel, overrides = []) {
  return CHAVES_PERMISSAO.filter((chave) => papelTemPermissao(papel, chave, overrides));
}

// Matriz completa { PAPEL: { "chave": true|false } } para a tela de administração.
export function montarMatriz(overrides = []) {
  const matriz = {};
  for (const papel of PAPEIS) {
    matriz[papel] = {};
    for (const chave of CHAVES_PERMISSAO) {
      matriz[papel][chave] = papelTemPermissao(papel, chave, overrides);
    }
  }
  return matriz;
}
