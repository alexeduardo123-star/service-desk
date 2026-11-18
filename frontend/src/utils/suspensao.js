import { StatusTicket } from "../enum/StatusTicket";

// SUSPENSO não aparece no seletor de status: suspender exige motivo, então só
// entra pela ação "Suspender" (a API também recusa SUSPENSO na troca comum).
export const STATUS_SELECIONAVEIS = Object.values(StatusTicket).filter((s) => s !== StatusTicket.SUSPENSO);

// Fechado não se suspende, e suspenso já está suspenso.
export function podeSuspender(ticket) {
  return ticket.status !== StatusTicket.SUSPENSO && ticket.status !== StatusTicket.FECHADO;
}

export function podeRetomar(ticket) {
  return ticket.status === StatusTicket.SUSPENSO;
}
