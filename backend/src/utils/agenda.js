// Regras da agenda: prazos de SLA dos chamados e atendimentos agendados.

const HORA_MS = 3_600_000;
export const DURACAO_MAXIMA_HORAS = 12;
export const PERIODO_MAXIMO_DIAS = 62;

// Prazo de SLA do chamado (abertura + horas da prioridade). Mesma regra de
// metricas.js: chamado fechado ou suspenso não tem prazo correndo.
export function prazoSla(ticket) {
  if (ticket.status === "FECHADO" || ticket.status === "SUSPENSO") return null;
  if (ticket.aprovacaoStatus === "REJEITADA") return null;
  const horas = ticket.prioridade?.slaHoras;
  if (!horas) return null;
  return new Date(new Date(ticket.createdAt).getTime() + horas * HORA_MS);
}

// Prazos de SLA que caem em [inicio, fim), em ordem cronológica, já marcando
// os que venceram (relativo a `agora`).
export function prazosNoPeriodo(tickets, inicio, fim, agora = new Date()) {
  return tickets
    .map((ticket) => ({ ticket, prazo: prazoSla(ticket) }))
    .filter(({ prazo }) => prazo && prazo >= inicio && prazo < fim)
    .sort((a, b) => a.prazo - b.prazo)
    .map(({ ticket, prazo }) => ({
      ticketId: ticket.id,
      titulo: ticket.titulo,
      status: ticket.status,
      prazo,
      vencido: prazo < agora,
      prioridade: ticket.prioridade ? { id: ticket.prioridade.id, nome: ticket.prioridade.nome } : null,
      tecnico: ticket.tecnico ?? null,
    }));
}

// Os horários são consecutivos, sem sobreposição? (fim de um = início do outro é ok)
export const sobrepoe = (a, b) => a.inicio < b.fim && a.fim > b.inicio;

// Quem pode mexer no agendamento: o próprio atendente, ou quem tem a permissão
// de gerenciar a agenda de todos.
export function podeGerenciarAgendamento({ usuarioId, atendenteId, temPermissaoTodos }) {
  return temPermissaoTodos || usuarioId === atendenteId;
}
