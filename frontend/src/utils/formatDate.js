import { lerPreferencias } from "./preferencias";

const OPCOES = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

export function formatDate(isoString) {
  if (!isoString) return "-";
  const data = new Date(isoString);
  try {
    return data.toLocaleString("pt-BR", { ...OPCOES, timeZone: lerPreferencias().fusoHorario });
  } catch {
    // fuso inválido no storage: cai para o fuso do navegador
    return data.toLocaleString("pt-BR", OPCOES);
  }
}
