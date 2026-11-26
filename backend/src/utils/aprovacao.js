// Regras da aprovação do gestor. Funções puras: devolvem a mensagem de erro para
// a API (ou null quando pode seguir), como as regras de suspensão.
//
// Fluxo: a categoria do chamado pode exigir aprovação (Categoria.exigeAprovacao).
// Nesse caso o chamado nasce PENDENTE e o gestor do setor aprova ou rejeita.
// Rejeitar fecha o chamado com o motivo. Enquanto está pendente ninguém da
// equipe consegue mexer no atendimento.

export function statusInicialAprovacao(categoria) {
  return categoria?.exigeAprovacao ? "PENDENTE" : "NAO_EXIGIDA";
}

// Bloqueia o atendimento (mudar status, suspender, retomar, atribuir) de um
// chamado que ainda espera ou foi barrado pelo gestor.
export function erroDeAprovacao(ticket) {
  if (ticket.aprovacaoStatus === "PENDENTE") return "Chamado aguardando aprovação do gestor";
  if (ticket.aprovacaoStatus === "REJEITADA") return "Chamado rejeitado pelo gestor";
  return null;
}

export function erroAoDecidir(ticket) {
  return ticket.aprovacaoStatus === "PENDENTE" ? null : "Este chamado não está aguardando aprovação";
}

// ADMIN decide qualquer chamado; o gestor só os do seu próprio setor.
// aprovador: { papel, departamentoId } lido do banco (o token não traz o setor).
export function podeDecidirAprovacao(aprovador, ticket) {
  if (!aprovador) return false;
  if (aprovador.papel === "ADMIN") return true;
  return Boolean(aprovador.departamentoId) && aprovador.departamentoId === ticket.departamentoId;
}

export function comentarioDeAprovacao(nome) {
  return `Chamado aprovado por ${nome}.`;
}

export function comentarioDeRejeicao(nome, motivo) {
  return `Chamado rejeitado por ${nome}. Motivo: ${motivo}`;
}
