import prisma from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const relacoes = {
  servico: { select: { id: true, nome: true } },
  formulario: { select: { id: true, nome: true } },
  prioridade: { select: { id: true, nome: true, nivel: true, slaHoras: true } },
};

// Confere se o serviço e o formulário informados existem antes de gravar,
// para devolver uma mensagem clara em vez do erro genérico de chave estrangeira.
async function validarVinculos({ servicoId, formularioId, prioridadeId }) {
  const servico = await prisma.servico.findUnique({ where: { id: servicoId }, select: { id: true } });
  if (!servico) return "Serviço não encontrado";

  const prioridade = await prisma.prioridade.findUnique({ where: { id: prioridadeId }, select: { id: true } });
  if (!prioridade) return "Prioridade não encontrada";

  if (formularioId) {
    const formulario = await prisma.formulario.findUnique({ where: { id: formularioId }, select: { id: true } });
    if (!formulario) return "Formulário não encontrado";
  }
  return null;
}

export const listar = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.servicoId !== undefined) {
    const servicoId = Number(req.query.servicoId);
    if (!Number.isSafeInteger(servicoId) || servicoId <= 0) {
      return res.status(400).json({ erro: "Serviço inválido" });
    }
    where.servicoId = servicoId;
  }

  res.json(
    await prisma.assunto.findMany({
      where,
      include: relacoes,
      orderBy: [{ servico: { nome: "asc" } }, { nome: "asc" }],
    })
  );
});

// Traz o formulário completo (com campos) para quem for abrir um chamado.
export const buscar = asyncHandler(async (req, res) => {
  const item = await prisma.assunto.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      servico: { select: { id: true, nome: true } },
      prioridade: { select: { id: true, nome: true, nivel: true, slaHoras: true } },
      formulario: { include: { campos: { orderBy: { ordem: "asc" } } } },
    },
  });
  if (!item) return res.status(404).json({ erro: "Assunto não encontrado" });
  res.json(item);
});

export const criar = asyncHandler(async (req, res) => {
  const erro = await validarVinculos(req.body);
  if (erro) return res.status(400).json({ erro });

  res.status(201).json(await prisma.assunto.create({ data: req.body, include: relacoes }));
});

export const atualizar = asyncHandler(async (req, res) => {
  const erro = await validarVinculos(req.body);
  if (erro) return res.status(400).json({ erro });

  res.json(
    await prisma.assunto.update({ where: { id: Number(req.params.id) }, data: req.body, include: relacoes })
  );
});

export const excluir = asyncHandler(async (req, res) => {
  await prisma.assunto.delete({ where: { id: Number(req.params.id) } });
  res.status(204).send();
});
