// Preferências do usuário que afetam a renderização (fuso horário e itens por
// página). Ficam em localStorage para que utilitários simples como formatDate
// consigam lê-las sem precisar de contexto React. A fonte da verdade continua
// sendo o backend (/configuracoes/me); aqui é só um cache.
const CHAVE = "preferencias";

export const PREFERENCIAS_PADRAO = Object.freeze({
  itensPorPagina: 10,
  fusoHorario: "America/Sao_Paulo",
});

export function lerPreferencias() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE) || "{}");
    return { ...PREFERENCIAS_PADRAO, ...salvo };
  } catch {
    return { ...PREFERENCIAS_PADRAO };
  }
}

export function salvarPreferencias(config = {}) {
  const { itensPorPagina, fusoHorario } = config;
  const novas = { ...lerPreferencias() };
  if (itensPorPagina) novas.itensPorPagina = itensPorPagina;
  if (fusoHorario) novas.fusoHorario = fusoHorario;
  localStorage.setItem(CHAVE, JSON.stringify(novas));
  return novas;
}

export function limparPreferencias() {
  localStorage.removeItem(CHAVE);
}
