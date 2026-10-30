import prisma from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Cada usuário só vê e altera os próprios relatórios salvos.
const doUsuario = (req) => ({ id: Number(req.params.id), usuarioId: req.user.id });

export const listar = asyncHandler(async (req, res) => {
  const relatorios = await prisma.relatorioSalvo.findMany({
    where: { usuarioId: req.user.id },
    orderBy: { updatedAt: "desc" },
  });
  res.json(relatorios);
});

export const buscar = asyncHandler(async (req, res) => {
  const relatorio = await prisma.relatorioSalvo.findFirst({ where: doUsuario(req) });
  if (!relatorio) return res.status(404).json({ erro: "Não encontrado" });
  res.json(relatorio);
});

export const criar = asyncHandler(async (req, res) => {
  const { nome, descricao, filtros } = req.body;
  const relatorio = await prisma.relatorioSalvo.create({
    data: { nome, descricao: descricao ?? null, filtros, usuarioId: req.user.id },
  });
  res.status(201).json(relatorio);
});

export const atualizar = asyncHandler(async (req, res) => {
  const existente = await prisma.relatorioSalvo.findFirst({ where: doUsuario(req) });
  if (!existente) return res.status(404).json({ erro: "Não encontrado" });

  const { nome, descricao, filtros } = req.body;
  const relatorio = await prisma.relatorioSalvo.update({
    where: { id: existente.id },
    data: { nome, descricao, filtros },
  });
  res.json(relatorio);
});

export const excluir = asyncHandler(async (req, res) => {
  const { count } = await prisma.relatorioSalvo.deleteMany({ where: doUsuario(req) });
  if (count === 0) return res.status(404).json({ erro: "Não encontrado" });
  res.status(204).send();
});
