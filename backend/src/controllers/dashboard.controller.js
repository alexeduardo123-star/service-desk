import prisma from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { calcularMetricas } from "../utils/metricas.js";

const DIAS_PERMITIDOS = [7, 14, 30];

// Resumo para o dashboard. Solicitante vê só os próprios chamados; técnico e
// admin veem tudo (e o ranking de técnicos).
export const resumo = asyncHandler(async (req, res) => {
  const dias = DIAS_PERMITIDOS.includes(Number(req.query.dias)) ? Number(req.query.dias) : 14;
  const ehSolicitante = req.user.papel === "SOLICITANTE";

  const tickets = await prisma.ticket.findMany({
    where: ehSolicitante ? { solicitanteId: req.user.id } : {},
    select: {
      id: true,
      status: true,
      createdAt: true,
      closedAt: true,
      tecnicoId: true,
      tecnico: { select: { nome: true } },
      categoria: { select: { nome: true } },
      prioridade: { select: { nome: true, nivel: true, slaHoras: true } },
    },
  });

  res.json({ dias, ...calcularMetricas(tickets, { dias, incluirTecnicos: !ehSolicitante }) });
});
