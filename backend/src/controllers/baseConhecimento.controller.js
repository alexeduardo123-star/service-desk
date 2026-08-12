import prisma from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const include = {
  categoria: true,
  autor: { select: { id: true, nome: true } },
};

export const listar = asyncHandler(async (req, res) => {
  const artigos = await prisma.baseConhecimento.findMany({ include, orderBy: { createdAt: "desc" } });
  res.json(artigos);
});

export const buscar = asyncHandler(async (req, res) => {
  const artigo = await prisma.baseConhecimento.findUnique({ where: { id: Number(req.params.id) }, include });
  if (!artigo) return res.status(404).json({ erro: "Não encontrado" });
  res.json(artigo);
});

export const criar = asyncHandler(async (req, res) => {
  const { titulo, conteudo, categoriaId } = req.body;
  const artigo = await prisma.baseConhecimento.create({
    data: { titulo, conteudo, categoriaId: categoriaId || null, autorId: req.user.id },
    include,
  });
  res.status(201).json(artigo);
});

export const atualizar = asyncHandler(async (req, res) => {
  const { titulo, conteudo, categoriaId } = req.body;
  const artigo = await prisma.baseConhecimento.update({
    where: { id: Number(req.params.id) },
    data: { titulo, conteudo, categoriaId },
    include,
  });
  res.json(artigo);
});

export const excluir = asyncHandler(async (req, res) => {
  await prisma.baseConhecimento.delete({ where: { id: Number(req.params.id) } });
  res.status(204).send();
});
