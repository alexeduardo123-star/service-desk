import { StatusTicket } from "../enum/StatusTicket";

// Cores dos gráficos (hex porque vão em atributos SVG, fora do Tailwind).
export const CORES_STATUS = {
  [StatusTicket.ABERTO]: "#f59e0b",
  [StatusTicket.EM_ANDAMENTO]: "#2563eb",
  [StatusTicket.FECHADO]: "#10b981",
};

export const PALETA = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#ec4899", "#64748b"];

// Prioridade vai do verde (baixa) ao vermelho (urgente), pelo nível 1..4.
export const COR_POR_NIVEL = { 1: "#10b981", 2: "#f59e0b", 3: "#f97316", 4: "#ef4444" };
