import prisma from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const comCampos = {
  campos: { orderBy: { ordem: "asc" } },
  _count: { select: { assuntos: true } },
};

export const listar = asyncHandler(async (_req, res) => {
  res.json(await prisma.formulario.findMany({ include: comCampos, orderBy: { nome: "asc" } }));
});

export const buscar = asyncHandler(async (req, res) => {
  const item = await prisma.formulario.findUnique({ where: { id: Number(req.params.id) }, include: comCampos });
  if (!item) return res.status(404).json({ erro: "Formulário não encontrado" });
  res.json(item);
});

export const criar = asyncHandler(async (req, res) => {
  const { campos, ...dados } = req.body;
  const item = await prisma.formulario.create({
    data: { ...dados, campos: { create: campos } },
    include: comCampos,
  });
  res.status(201).json(item);
});

// Os campos são substituídos por inteiro (apaga e recria na mesma operação),
// assim a ordem e as remoções feitas na tela ficam exatamente como enviadas.
export const atualizar = asyncHandler(async (req, res) => {
  const { campos, ...dados } = req.body;
  const item = await prisma.formulario.update({
    where: { id: Number(req.params.id) },
    data: { ...dados, campos: { deleteMany: {}, create: campos } },
    include: comCampos,
  });
  res.json(item);
});

export const excluir = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const assuntos = await prisma.assunto.count({ where: { formularioId: id } });
  if (assuntos > 0) {
    return res
      .status(409)
      .json({ erro: `Não é possível excluir: o formulário está vinculado a ${assuntos} assunto(s)` });
  }
  await prisma.formulario.delete({ where: { id } });
  res.status(204).send();
});
