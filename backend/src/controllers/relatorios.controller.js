import prisma from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { montarFiltroTickets } from "../utils/filtrosTicket.js";
import { calcularMetricas } from "../utils/metricas.js";
import { montarLinhas } from "../utils/relatorio.js";

const LIMITE_LINHAS = 5000;

const include = {
  solicitante: { select: { id: true, nome: true } },
  tecnico: { select: { id: true, nome: true } },
  categoria: true,
  prioridade: true,
};

// Relatório de chamados: aplica os mesmos filtros da listagem (status,
// categoria, prioridade, técnico, texto e período) e devolve o resumo de
// indicadores junto com as linhas detalhadas.
export const chamados = asyncHandler(async (req, res) => {
  const where = montarFiltroTickets(req.query, req.user);
  const agora = new Date();

  const tickets = await prisma.ticket.findMany({
    where,
    include,
    orderBy: { createdAt: "desc" },
    take: LIMITE_LINHAS + 1,
  });
  const truncado = tickets.length > LIMITE_LINHAS;
  const lista = truncado ? tickets.slice(0, LIMITE_LINHAS) : tickets;

  // A série por dia não faz sentido num relatório de período livre.
  // eslint-disable-next-line no-unused-vars
  const { porDia, ...resumo } = calcularMetricas(lista, { agora, dias: 1 });

  res.json({
    geradoEm: agora.toISOString(),
    geradoPor: req.user.nome,
    total: lista.length,
    truncado,
    resumo,
    linhas: montarLinhas(lista, agora),
  });
});
