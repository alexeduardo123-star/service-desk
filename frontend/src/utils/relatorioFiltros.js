export const FILTROS_RELATORIO_VAZIOS = Object.freeze({
  de: "",
  ate: "",
  status: "",
  categoriaId: "",
  prioridadeId: "",
  tecnicoId: "",
  q: "",
});

// Remove filtros vazios antes de mandar para a API (ou salvar).
export function limparFiltros(filtros) {
  return Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== "" && v != null).map(([k, v]) => [k, String(v)]));
}

// Junta um relatório salvo com os campos padrão, ignorando chaves antigas/desconhecidas.
export function filtrosDoSalvo(salvo) {
  const resultado = { ...FILTROS_RELATORIO_VAZIOS };
  for (const chave of Object.keys(FILTROS_RELATORIO_VAZIOS)) {
    if (salvo?.[chave] != null) resultado[chave] = String(salvo[chave]);
  }
  return resultado;
}

export function resumirFiltros(filtros) {
  return Object.keys(limparFiltros(filtros)).length;
}

// yyyy-mm-dd de N dias atrás (usado como período padrão do relatório).
export function dataDiasAtras(dias, agora = new Date()) {
  return new Date(agora.getTime() - dias * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
