import prisma from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const relacoes = { fornecedor: { select: { id: true, nome: true } }, equipamento: { select: { id: true, nome: true, numeroSerie: true } } };

export const listar = asyncHandler(async (_req, res) => {
  res.json(await prisma.contratoManutencao.findMany({ include: relacoes, orderBy: { inicio: "desc" } }));
});

export const buscar = asyncHandler(async (req, res) => {
  const item = await prisma.contratoManutencao.findUnique({ where: { id: Number(req.params.id) }, include: relacoes });
  if (!item) return res.status(404).json({ erro: "Contrato não encontrado" });
  res.json(item);
});

export const criar = asyncHandler(async (req, res) => {
  const item = await prisma.contratoManutencao.create({ data: req.body, include: relacoes });
  res.status(201).json(item);
});

export const atualizar = asyncHandler(async (req, res) => {
  res.json(await prisma.contratoManutencao.update({ where: { id: Number(req.params.id) }, data: req.body, include: relacoes }));
});

export const excluir = asyncHandler(async (req, res) => {
  await prisma.contratoManutencao.delete({ where: { id: Number(req.params.id) } });
  res.status(204).send();
});
