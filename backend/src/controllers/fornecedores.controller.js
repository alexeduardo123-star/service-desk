import prisma from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listar = asyncHandler(async (_req, res) => {
  res.json(await prisma.fornecedor.findMany({ orderBy: { nome: "asc" } }));
});

export const buscar = asyncHandler(async (req, res) => {
  const item = await prisma.fornecedor.findUnique({ where: { id: Number(req.params.id) } });
  if (!item) return res.status(404).json({ erro: "Fornecedor não encontrado" });
  res.json(item);
});

export const criar = asyncHandler(async (req, res) => {
  res.status(201).json(await prisma.fornecedor.create({ data: req.body }));
});

export const atualizar = asyncHandler(async (req, res) => {
  res.json(await prisma.fornecedor.update({ where: { id: Number(req.params.id) }, data: req.body }));
});

export const excluir = asyncHandler(async (req, res) => {
  await prisma.fornecedor.delete({ where: { id: Number(req.params.id) } });
  res.status(204).send();
});
