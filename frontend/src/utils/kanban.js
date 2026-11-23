import { PapelUsuario } from "../enum/PapelUsuario";
import { StatusTicket } from "../enum/StatusTicket";

const HORA_MS = 60 * 60 * 1000;

export const COLUNAS_KANBAN = [
  StatusTicket.ABERTO,
  StatusTicket.EM_ANDAMENTO,
  StatusTicket.AGUARDANDO_USUARIO,
  StatusTicket.SUSPENSO,
  StatusTicket.FECHADO,
];

export function agruparPorStatus(tickets) {
  const grupos = Object.fromEntries(COLUNAS_KANBAN.map((status) => [status, []]));
  for (const ticket of tickets) grupos[ticket.status]?.push(ticket);
  return grupos;
}

// Chamado em aberto cujo prazo (SLA da prioridade, em horas) já estourou.
// Suspenso não aparece como atrasado enquanto estiver suspenso.
export function slaVencido(ticket, agora = new Date()) {
  const sla = ticket.prioridade?.slaHoras;
  if (ticket.status === StatusTicket.FECHADO || ticket.status === StatusTicket.SUSPENSO || !sla) return false;
  return agora.getTime() - new Date(ticket.createdAt).getTime() > sla * HORA_MS;
}

// O que fazer quando o cartão é solto em outra coluna:
// - "exigeMotivo": suspender pede motivo, então não dá para fazer arrastando;
// - "retomar":     suspenso -> em andamento é a ação "Retomar" (avisa o solicitante);
// - "assumir":     técnico puxa um chamado sem responsável para "Em andamento";
// - "status":      troca de status comum.
export function acaoAoMover(ticket, destino, usuario) {
  if (destino === StatusTicket.SUSPENSO) return "exigeMotivo";
  if (ticket.status === StatusTicket.SUSPENSO && destino === StatusTicket.EM_ANDAMENTO) return "retomar";
  if ((usuario.papel === PapelUsuario.TECNICO || usuario.permissoes?.includes("TICKETS_GERENCIAR")) && destino === StatusTicket.EM_ANDAMENTO && !ticket.tecnico) return "assumir";
  return "status";
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

export function filtrarTickets(tickets, { busca = "", prioridadeId = "", categoriaId = "", departamentoId = "", apenasMeus = false, apenasAtrasados = false, usuarioId = null }, agora = new Date()) {
  const termo = busca.trim().toLowerCase();
  return tickets.filter((t) => {
    if (termo && !`${t.titulo} ${t.descricao ?? ""} #${t.id}`.toLowerCase().includes(termo)) return false;
    if (prioridadeId && t.prioridade?.id !== Number(prioridadeId)) return false;
    if (categoriaId && t.categoria?.id !== Number(categoriaId)) return false;
    if (departamentoId && t.departamento?.id !== Number(departamentoId)) return false;
    if (apenasMeus && t.tecnico?.id !== usuarioId) return false;
    if (apenasAtrasados && !slaVencido(t, agora)) return false;
    return true;
  });
}
