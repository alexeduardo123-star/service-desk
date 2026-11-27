import { temPermissao } from "./permissoes";

// Cadastros do administrador que ficam no menu da engrenagem (Configurações),
// agrupados por assunto. Cada item aparece só para quem tem a permissão.
export const GRUPOS_CADASTROS = [
  {
    titulo: "Acesso",
    itens: [
      { to: "/admin/usuarios", rotulo: "Usuários", permissao: "usuarios.gerenciar" },
      { to: "/admin/perfis", rotulo: "Perfis e permissões", permissao: "permissoes.gerenciar" },
    ],
  },
  {
    titulo: "Atendimento",
    itens: [
      { to: "/admin/departamentos", rotulo: "Setores", permissao: "cadastros.gerenciar" },
      { to: "/admin/categorias", rotulo: "Categorias", permissao: "cadastros.gerenciar" },
      { to: "/admin/prioridades", rotulo: "Prioridades", permissao: "cadastros.gerenciar" },
      { to: "/admin/servicos", rotulo: "Serviços", permissao: "cadastros.gerenciar" },
      { to: "/admin/assuntos", rotulo: "Assuntos", permissao: "cadastros.gerenciar" },
      { to: "/admin/formularios", rotulo: "Formulários", permissao: "cadastros.gerenciar" },
    ],
  },
  {
    titulo: "Ativos e contratos",
    itens: [
      { to: "/admin/equipamentos", rotulo: "Equipamentos", permissao: "equipamentos.gerenciar" },
      { to: "/admin/fornecedores", rotulo: "Fornecedores", permissao: "fornecedores.ver" },
      { to: "/admin/contratos", rotulo: "Contratos", permissao: "contratos.ver" },
    ],
  },
];

// Grupos com só os itens que o usuário pode abrir; grupos vazios saem.
export function gruposVisiveis(usuario) {
  return GRUPOS_CADASTROS.map((grupo) => ({
    ...grupo,
    itens: grupo.itens.filter((item) => temPermissao(usuario, item.permissao)),
  })).filter((grupo) => grupo.itens.length > 0);
}
