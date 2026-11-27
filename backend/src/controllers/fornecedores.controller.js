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

// CNPJ é único. Confere antes de gravar para dizer qual fornecedor já usa o
// número, em vez do erro genérico de registro duplicado.
async function erroDeCnpjRepetido(cnpj, idAtual = null) {
  const existente = await prisma.fornecedor.findUnique({ where: { cnpj }, select: { id: true, nome: true } });
  if (existente && existente.id !== idAtual) {
    return `Já existe um fornecedor com este CNPJ: ${existente.nome}`;
  }
  return null;
}

export const criar = asyncHandler(async (req, res) => {
  const erro = await erroDeCnpjRepetido(req.body.cnpj);
  if (erro) return res.status(409).json({ erro });

  res.status(201).json(await prisma.fornecedor.create({ data: req.body }));
});

export const atualizar = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const erro = await erroDeCnpjRepetido(req.body.cnpj, id);
  if (erro) return res.status(409).json({ erro });

  res.json(await prisma.fornecedor.update({ where: { id }, data: req.body }));
});

export const excluir = asyncHandler(async (req, res) => {
  await prisma.fornecedor.delete({ where: { id: Number(req.params.id) } });
  res.status(204).send();
});
