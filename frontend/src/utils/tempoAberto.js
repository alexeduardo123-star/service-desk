import { StatusTicket } from "../enum/StatusTicket";

const MINUTO_MS = 60 * 1000;
const HORA_MS = 60 * MINUTO_MS;
const DIA_MS = 24 * HORA_MS;

// "45 min", "6 h", "3 dias" — a unidade maior que couber.
function duracao(ms) {
  if (ms < HORA_MS) return `${Math.max(1, Math.floor(ms / MINUTO_MS))} min`;
  if (ms < DIA_MS) return `${Math.floor(ms / HORA_MS)} h`;
  const dias = Math.floor(ms / DIA_MS);
  return dias === 1 ? "1 dia" : `${dias} dias`;
}

// Quanto tempo o chamado está (ou ficou) aberto: "aberto há 3 dias". Em chamado
// fechado conta até o fechamento, senão o texto cresceria para sempre.
export function tempoAberto(ticket, agora = new Date()) {
  const inicio = new Date(ticket?.createdAt ?? NaN).getTime();
  if (Number.isNaN(inicio)) return null;

  const fechado = ticket.status === StatusTicket.FECHADO && ticket.closedAt;
  const fim = fechado ? new Date(ticket.closedAt).getTime() : agora.getTime();
  if (Number.isNaN(fim)) return null;

  const texto = duracao(Math.max(0, fim - inicio));
  return fechado ? `ficou ${texto} aberto` : `aberto há ${texto}`;
}
