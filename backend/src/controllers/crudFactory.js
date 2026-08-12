import prisma from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Fábrica de controller CRUD para recursos "catálogo" (sem regra de negócio
// própria além de listar/criar/atualizar/excluir).
export function makeCrudController(modelName) {
  const model = prisma[modelName];

  return {
    listar: asyncHandler(async (req, res) => {
      const registros = await model.findMany({ orderBy: { id: "asc" } });
      res.json(registros);
    }),

    buscar: asyncHandler(async (req, res) => {
      const registro = await model.findUnique({ where: { id: Number(req.params.id) } });
      if (!registro) return res.status(404).json({ erro: "Não encontrado" });
      res.json(registro);
    }),

    criar: asyncHandler(async (req, res) => {
      const registro = await model.create({ data: req.body });
      res.status(201).json(registro);
    }),

    atualizar: asyncHandler(async (req, res) => {
      const registro = await model.update({
        where: { id: Number(req.params.id) },
        data: req.body,
      });
      res.json(registro);
    }),

    excluir: asyncHandler(async (req, res) => {
      await model.delete({ where: { id: Number(req.params.id) } });
      res.status(204).send();
    }),
  };
}
