import { StatusTicket } from "../enum/StatusTicket";

const HORA_MS = 60 * 60 * 1000;

export const COLUNAS_KANBAN = [StatusTicket.ABERTO, StatusTicket.EM_ANDAMENTO, StatusTicket.FECHADO];

export function agruparPorStatus(tickets) {
  const grupos = Object.fromEntries(COLUNAS_KANBAN.map((status) => [status, []]));
  for (const ticket of tickets) grupos[ticket.status]?.push(ticket);
  return grupos;
}

// Chamado em aberto cujo prazo (SLA da prioridade, em horas) já estourou.
export function slaVencido(ticket, agora = new Date()) {
  const sla = ticket.prioridade?.slaHoras;
  if (ticket.status === StatusTicket.FECHADO || !sla) return false;
  return agora.getTime() - new Date(ticket.createdAt).getTime() > sla * HORA_MS;
}

// Atualização otimista: devolve uma nova lista com o chamado já no novo status
// (sem esperar a API). Se a API falhar, a tela recarrega os dados reais.
export function moverTicket(tickets, id, novoStatus, agora = new Date()) {
  return tickets.map((t) =>
    t.id === id
      ? { ...t, status: novoStatus, closedAt: novoStatus === StatusTicket.FECHADO ? agora.toISOString() : null }
      : t
  );
}

export function filtrarTickets(tickets, { busca = "", prioridadeId = "", categoriaId = "", apenasMeus = false, apenasAtrasados = false, usuarioId = null }, agora = new Date()) {
  const termo = busca.trim().toLowerCase();
  return tickets.filter((t) => {
    if (termo && !`${t.titulo} ${t.descricao ?? ""} #${t.id}`.toLowerCase().includes(termo)) return false;
    if (prioridadeId && t.prioridade?.id !== Number(prioridadeId)) return false;
    if (categoriaId && t.categoria?.id !== Number(categoriaId)) return false;
    if (apenasMeus && t.tecnico?.id !== usuarioId) return false;
    if (apenasAtrasados && !slaVencido(t, agora)) return false;
    return true;
  });
}
