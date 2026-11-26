import { temPermissao } from "./permissoes";

// Aprovação do gestor (categorias que exigem). O servidor é quem decide se o
// gestor pode mesmo aprovar aquele chamado (só os do próprio setor); aqui só
// escondemos os botões de quem não tem a permissão.

export function aguardandoAprovacao(ticket) {
  return ticket?.aprovacaoStatus === "PENDENTE";
}

// Pendente ou rejeitado: a equipe não pode mexer no atendimento.
export function bloqueadoPorAprovacao(ticket) {
  return ticket?.aprovacaoStatus === "PENDENTE" || ticket?.aprovacaoStatus === "REJEITADA";
}

export function podeDecidirAprovacao(usuario, ticket) {
  return aguardandoAprovacao(ticket) && temPermissao(usuario, "tickets.aprovar");
}
