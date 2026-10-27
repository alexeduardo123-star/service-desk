import prisma from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const include = { ticket: { select: { id: true, titulo: true } } };

const TIPOS = ["TICKET_CRIADO", "TICKET_ATRIBUIDO", "TICKET_STATUS", "TICKET_COMENTARIO", "SISTEMA"];

// Cada usuário só enxerga e altera as próprias notificações: todas as queries
// filtram por usuarioId = req.user.id.

export const listar = asyncHandler(async (req, res) => {
  const { lida, tipo } = req.query;
  const where = { usuarioId: req.user.id };
  if (lida === "true" || lida === "false") where.lida = lida === "true";
  if (TIPOS.includes(tipo)) where.tipo = tipo;

  const limite = Math.min(Number(req.query.limite) || 100, 200);
  const notificacoes = await prisma.notificacao.findMany({
    where,
    include,
    orderBy: { createdAt: "desc" },
    take: limite,
  });
  res.json(notificacoes);
});

export const contarNaoLidas = asyncHandler(async (req, res) => {
  const total = await prisma.notificacao.count({ where: { usuarioId: req.user.id, lida: false } });
  res.json({ total });
});

export const buscar = asyncHandler(async (req, res) => {
  const notificacao = await prisma.notificacao.findFirst({
    where: { id: Number(req.params.id), usuarioId: req.user.id },
    include,
  });
  if (!notificacao) return res.status(404).json({ erro: "Não encontrado" });
  res.json(notificacao);
});

// Comunicado manual: ADMIN escolhe todos, um perfil ou um usuário específico.
export const criar = asyncHandler(async (req, res) => {
  const { titulo, mensagem, destino, ticketId } = req.body;

  const where = { ativo: true };
  if (destino.tipo === "PAPEL") where.papel = destino.papel;
  if (destino.tipo === "USUARIO") where.id = destino.usuarioId;

  const usuarios = await prisma.usuario.findMany({ where, select: { id: true } });
  if (usuarios.length === 0) return res.status(404).json({ erro: "Nenhum destinatário encontrado" });

  const { count } = await prisma.notificacao.createMany({
    data: usuarios.map((u) => ({
      usuarioId: u.id,
      tipo: "SISTEMA",
      titulo,
      mensagem,
      ticketId: ticketId ?? null,
    })),
  });
  res.status(201).json({ enviadas: count });
});

export const marcarLida = asyncHandler(async (req, res) => {
  const { lida } = req.body;
  const { count } = await prisma.notificacao.updateMany({
    where: { id: Number(req.params.id), usuarioId: req.user.id },
    data: { lida, lidaEm: lida ? new Date() : null },
  });
  if (count === 0) return res.status(404).json({ erro: "Não encontrado" });

  const notificacao = await prisma.notificacao.findUnique({ where: { id: Number(req.params.id) }, include });
  res.json(notificacao);
});

export const marcarTodasLidas = asyncHandler(async (req, res) => {
  const { count } = await prisma.notificacao.updateMany({
    where: { usuarioId: req.user.id, lida: false },
    data: { lida: true, lidaEm: new Date() },
  });
  res.json({ atualizadas: count });
});

export const excluir = asyncHandler(async (req, res) => {
  const { count } = await prisma.notificacao.deleteMany({
    where: { id: Number(req.params.id), usuarioId: req.user.id },
  });
  if (count === 0) return res.status(404).json({ erro: "Não encontrado" });
  res.status(204).send();
});

export const excluirLidas = asyncHandler(async (req, res) => {
  const { count } = await prisma.notificacao.deleteMany({ where: { usuarioId: req.user.id, lida: true } });
  res.json({ excluidas: count });
});
