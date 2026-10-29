import { fechadoNoPrazo, horasEntre, slaVencido } from "./metricas.js";

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
      solicitante: t.solicitante?.nome ?? null,
      tecnico: t.tecnico?.nome ?? null,
      criadoEm: t.createdAt,
      fechadoEm: t.closedAt ?? null,
      horasResolucao: t.closedAt ? Number(horasEntre(t.createdAt, t.closedAt).toFixed(1)) : null,
      // fechados: cumpriu o prazo? | em aberto: já estourou?
      slaStatus: t.status === "FECHADO" ? (noPrazo === null ? null : noPrazo ? "NO_PRAZO" : "ATRASADO") : slaVencido(t, agora) ? "VENCIDO" : "NO_PRAZO",
    };
  });
}
