import prisma from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const include = {
  solicitante: { select: { id: true, nome: true } },
  tecnico: { select: { id: true, nome: true } },
  categoria: true,
  prioridade: true,
  equipamento: true,
};

function podeVer(ticket, user) {
  return user.papel !== "SOLICITANTE" || ticket.solicitanteId === user.id;
}

export const listar = asyncHandler(async (req, res) => {
  const { status, categoriaId } = req.query;
  const where = {};
  if (req.user.papel === "SOLICITANTE") where.solicitanteId = req.user.id;
  if (status) where.status = status;
  if (categoriaId) where.categoriaId = Number(categoriaId);

  const tickets = await prisma.ticket.findMany({ where, include, orderBy: { createdAt: "desc" } });
  res.json(tickets);
});

export const buscar = asyncHandler(async (req, res) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id: Number(req.params.id) },
    include: { ...include, comentarios: { include: { usuario: { select: { id: true, nome: true } } }, orderBy: { createdAt: "asc" } } },
  });
  if (!ticket) return res.status(404).json({ erro: "Não encontrado" });
  if (!podeVer(ticket, req.user)) return res.status(403).json({ erro: "Acesso negado" });
  res.json(ticket);
});

export const criar = asyncHandler(async (req, res) => {
  const { titulo, descricao, categoriaId, prioridadeId, equipamentoId } = req.body;
  const ticket = await prisma.ticket.create({
    data: {
      titulo,
      descricao,
      categoriaId,
      prioridadeId,
      equipamentoId: equipamentoId || null,
      solicitanteId: req.user.id,
    },
    include,
  });
  res.status(201).json(ticket);
});

export const atualizar = asyncHandler(async (req, res) => {
  const ticket = await prisma.ticket.findUnique({ where: { id: Number(req.params.id) } });
  if (!ticket) return res.status(404).json({ erro: "Não encontrado" });
  if (!podeVer(ticket, req.user)) return res.status(403).json({ erro: "Acesso negado" });

  const { titulo, descricao, categoriaId, prioridadeId, equipamentoId } = req.body;
  const atualizado = await prisma.ticket.update({
    where: { id: ticket.id },
    data: { titulo, descricao, categoriaId, prioridadeId, equipamentoId },
    include,
  });
  res.json(atualizado);
});

export const alterarStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const data = { status };
  if (status === "FECHADO") data.closedAt = new Date();

  const ticket = await prisma.ticket.update({
    where: { id: Number(req.params.id) },
    data,
    include,
  });
  res.json(ticket);
});

export const atribuir = asyncHandler(async (req, res) => {
  const { tecnicoId } = req.body;
  const ticket = await prisma.ticket.update({
    where: { id: Number(req.params.id) },
    data: { tecnicoId, status: "EM_ANDAMENTO" },
    include,
  });
  res.json(ticket);
});

export const excluir = asyncHandler(async (req, res) => {
  await prisma.ticket.delete({ where: { id: Number(req.params.id) } });
  res.status(204).send();
});
