// Funções do seletor de assunto do novo chamado.

// Só assuntos ativos podem ser escolhidos, e o rótulo mostra o serviço.
export function opcoesAssunto(assuntos = []) {
  return assuntos
    .filter((a) => a.ativo)
    .map((a) => ({ value: a.id, label: a.servico?.nome ? `${a.servico.nome} — ${a.nome}` : a.nome }));
}

// Id (texto) da prioridade cadastrada no assunto; "" se não achar ou se o
// assunto ainda não tem prioridade.
export function prioridadeDoAssunto(assuntos = [], assuntoId) {
  const assunto = assuntos.find((a) => String(a.id) === String(assuntoId));
  const id = assunto?.prioridadeId ?? assunto?.prioridade?.id;
  return id ? String(id) : "";
}
