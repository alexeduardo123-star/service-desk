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
