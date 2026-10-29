import { StatusTicket } from "../enum/StatusTicket";
import { PapelUsuario } from "../enum/PapelUsuario";

export const STATUS_LABEL = {
  [StatusTicket.ABERTO]: "Aberto",
  [StatusTicket.EM_ANDAMENTO]: "Em andamento",
  [StatusTicket.FECHADO]: "Fechado",
};

export const STATUS_COR = {
  [StatusTicket.ABERTO]: "bg-amber-100 text-amber-800",
  [StatusTicket.EM_ANDAMENTO]: "bg-blue-100 text-blue-800",
  [StatusTicket.FECHADO]: "bg-emerald-100 text-emerald-800",
};

export const PAPEL_LABEL = {
  [PapelUsuario.ADMIN]: "Administrador",
  [PapelUsuario.TECNICO]: "Técnico",
  [PapelUsuario.SOLICITANTE]: "Solicitante",
};

export const TIPO_NOTIFICACAO_LABEL = {
  TICKET_CRIADO: "Novo chamado",
  TICKET_ATRIBUIDO: "Atribuição",
  TICKET_STATUS: "Status",
  TICKET_COMENTARIO: "Comentário",
  SISTEMA: "Comunicado",
};

export const TIPO_NOTIFICACAO_COR = {
  TICKET_CRIADO: "bg-amber-100 text-amber-800",
  TICKET_ATRIBUIDO: "bg-purple-100 text-purple-800",
  TICKET_STATUS: "bg-emerald-100 text-emerald-800",
  TICKET_COMENTARIO: "bg-blue-100 text-blue-800",
  SISTEMA: "bg-gray-200 text-gray-800",
};
