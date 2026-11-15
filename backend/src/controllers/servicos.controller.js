import prisma from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const comContagem = { _count: { select: { assuntos: true } } };

export const listar = asyncHandler(async (_req, res) => {
  res.json(await prisma.servico.findMany({ include: comContagem, orderBy: { nome: "asc" } }));
});

export const buscar = asyncHandler(async (req, res) => {
  const item = await prisma.servico.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      ...comContagem,
      assuntos: {
        orderBy: { nome: "asc" },
        select: { id: true, nome: true, ativo: true, formularioId: true },
      },
    },
  });
  if (!item) return res.status(404).json({ erro: "Serviço não encontrado" });
  res.json(item);
});

export const criar = asyncHandler(async (req, res) => {
  res.status(201).json(await prisma.servico.create({ data: req.body, include: comContagem }));
});

export const atualizar = asyncHandler(async (req, res) => {
  res.json(
    await prisma.servico.update({ where: { id: Number(req.params.id) }, data: req.body, include: comContagem })
  );
});

export const excluir = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const assuntos = await prisma.assunto.count({ where: { servicoId: id } });
  if (assuntos > 0) {
    return res
      .status(409)
      .json({ erro: `Não é possível excluir: o serviço possui ${assuntos} assunto(s) vinculado(s)` });
  }
  await prisma.servico.delete({ where: { id } });
  res.status(204).send();
});
