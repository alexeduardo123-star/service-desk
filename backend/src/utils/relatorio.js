import { fechadoNoPrazo, horasEntre, slaVencido } from "./metricas.js";

// fechados: cumpriu o prazo? | suspensos: SLA não é avaliado | em aberto: já estourou?
function slaStatus(t, noPrazo, agora) {
  if (t.status === "FECHADO") return noPrazo === null ? null : noPrazo ? "NO_PRAZO" : "ATRASADO";
  if (t.status === "SUSPENSO") return null;
  return slaVencido(t, agora) ? "VENCIDO" : "NO_PRAZO";
}

// Transforma os chamados do Prisma em linhas planas (uma por chamado), no
// formato que a tela de relatórios mostra e exporta para CSV.
export function montarLinhas(tickets, agora = new Date()) {
  return tickets.map((t) => {
    const noPrazo = fechadoNoPrazo(t);
    return {
      id: t.id,
      titulo: t.titulo,
      status: t.status,
      categoria: t.categoria?.nome ?? null,
      prioridade: t.prioridade?.nome ?? null,
      setor: t.departamento?.nome ?? null,
      solicitante: t.solicitante?.nome ?? null,
      tecnico: t.tecnico?.nome ?? null,
      criadoEm: t.createdAt,
      fechadoEm: t.closedAt ?? null,
      horasResolucao: t.closedAt ? Number(horasEntre(t.createdAt, t.closedAt).toFixed(1)) : null,
      slaStatus: slaStatus(t, noPrazo, agora),
    };
  });
}
