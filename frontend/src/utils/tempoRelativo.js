import { formatDate } from "./formatDate";

// "há 5 min", "há 3 h", "ontem"... Depois de uma semana mostra a data completa.
export function tempoRelativo(isoString, agora = new Date()) {
  if (!isoString) return "-";
  const diffMs = agora.getTime() - new Date(isoString).getTime();
  if (Number.isNaN(diffMs)) return "-";

  const minutos = Math.floor(diffMs / 60000);
  if (minutos < 1) return "agora mesmo";
  if (minutos < 60) return `há ${minutos} min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas} h`;

  const dias = Math.floor(horas / 24);
  if (dias === 1) return "ontem";
  if (dias < 7) return `há ${dias} dias`;

  return formatDate(isoString);
}
