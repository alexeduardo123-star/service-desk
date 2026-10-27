// Paginação em memória: devolve a fatia da página pedida (a página é "presa"
// ao intervalo válido, então nunca fica fora de alcance depois de um filtro).
export function paginar(lista, pagina = 1, porPagina = 10) {
  const total = lista.length;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  const atual = Math.min(Math.max(1, pagina), totalPaginas);
  const inicio = (atual - 1) * porPagina;
  return { itens: lista.slice(inicio, inicio + porPagina), pagina: atual, totalPaginas, total };
}
