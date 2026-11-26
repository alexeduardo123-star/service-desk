import { PapelUsuario } from "../enum/PapelUsuario";

// Padrões de cada perfil, espelhando backend/src/utils/permissoes.js. Só são
// usados quando o usuário salvo no navegador ainda não traz a lista de
// permissões (sessão antiga); depois do login/atualização o que vale é a lista
// que o servidor devolve, já com os ajustes do administrador.
const PADRAO_POR_PAPEL = {
  [PapelUsuario.TECNICO]: [
    "tickets.tratar",
    "relatorios.ver",
    "base.gerenciar",
    "equipamentos.gerenciar",
    "fornecedores.ver",
    "contratos.ver",
    "contratos.gerenciar",
  ],
  [PapelUsuario.GESTOR]: [
    "tickets.tratar",
    "tickets.aprovar",
    "relatorios.ver",
    "base.gerenciar",
    "fornecedores.ver",
    "contratos.ver",
  ],
  [PapelUsuario.SOLICITANTE]: [],
};

export function temPermissao(usuario, chave) {
  if (!usuario) return false;
  if (usuario.papel === PapelUsuario.ADMIN) return true;
  if (Array.isArray(usuario.permissoes)) return usuario.permissoes.includes(chave);
  return (PADRAO_POR_PAPEL[usuario.papel] ?? []).includes(chave);
}

export function temAlgumaPermissao(usuario, chaves) {
  return chaves.some((chave) => temPermissao(usuario, chave));
}
