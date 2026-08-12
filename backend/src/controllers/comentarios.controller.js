import prisma from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";

async function carregarTicket(ticketId) {
  return prisma.ticket.findUnique({ where: { id: Number(ticketId) } });
}

function podeVerTicket(ticket, user) {
  return user.papel !== "SOLICITANTE" || ticket.solicitanteId === user.id;
}

export const listar = asyncHandler(async (req, res) => {
  const ticket = await carregarTicket(req.params.ticketId);
  if (!ticket) return res.status(404).json({ erro: "Chamado não encontrado" });
  if (!podeVerTicket(ticket, req.user)) return res.status(403).json({ erro: "Acesso negado" });

  const comentarios = await prisma.comentario.findMany({
    where: { ticketId: ticket.id },
    include: { usuario: { select: { id: true, nome: true } } },
    orderBy: { createdAt: "asc" },
  });
  res.json(comentarios);
});

export const criar = asyncHandler(async (req, res) => {
  const ticket = await carregarTicket(req.params.ticketId);
  if (!ticket) return res.status(404).json({ erro: "Chamado não encontrado" });
  if (!podeVerTicket(ticket, req.user)) return res.status(403).json({ erro: "Acesso negado" });

  const comentario = await prisma.comentario.create({
    data: { ticketId: ticket.id, usuarioId: req.user.id, mensagem: req.body.mensagem },
    include: { usuario: { select: { id: true, nome: true } } },
  });
  res.status(201).json(comentario);
});

export const atualizar = asyncHandler(async (req, res) => {
  const comentario = await prisma.comentario.findUnique({ where: { id: Number(req.params.id) } });
  if (!comentario) return res.status(404).json({ erro: "Não encontrado" });
  if (comentario.usuarioId !== req.user.id) return res.status(403).json({ erro: "Só o autor pode editar" });

  const atualizado = await prisma.comentario.update({
    where: { id: comentario.id },
    data: { mensagem: req.body.mensagem },
    include: { usuario: { select: { id: true, nome: true } } },
  });
  res.json(atualizado);
});

export const excluir = asyncHandler(async (req, res) => {
  const comentario = await prisma.comentario.findUnique({ where: { id: Number(req.params.id) } });
  if (!comentario) return res.status(404).json({ erro: "Não encontrado" });
  if (comentario.usuarioId !== req.user.id && req.user.papel !== "ADMIN") {
    return res.status(403).json({ erro: "Sem permissão para excluir" });
  }

  await prisma.comentario.delete({ where: { id: comentario.id } });
  res.status(204).send();
});
