import { COR_POR_NIVEL } from "../constants/cores";

// Funções puras usadas pelos componentes de components/CamposChamado.jsx.

export const COR_PRIORIDADE_PADRAO = "#9ca3af";

export function corDaPrioridade(prioridade) {
  return COR_POR_NIVEL[prioridade?.nivel] ?? COR_PRIORIDADE_PADRAO;
}

// "+1 colaborador", "+3 colaboradores"; null quando não há nenhum.
export function textoColaboradores(colaboradores) {
  const total = colaboradores?.length ?? 0;
  if (total === 0) return null;
  return `+${total} ${total === 1 ? "colaborador" : "colaboradores"}`;
}
