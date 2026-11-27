import prisma from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { listarArtigosQuerySchema, sugestoesQuerySchema } from "../schemas/baseConhecimento.schemas.js";
import { extrairPalavras, gerarTrecho, ordenarSugestoes, termosDeBusca } from "../utils/sugestaoArtigos.js";

const include = {
  categoria: true,
  autor: { select: { id: true, nome: true } },
};

// Quantos candidatos o banco devolve para a pontuação escolher os 5 melhores.
const CANDIDATOS_SUGESTAO = 50;

function consultaInvalida(res, resultado) {
  return res.status(400).json({ erro: resultado.error.issues[0]?.message || "Consulta inválida" });
}

// Filtro do banco para "título ou conteúdo contém o termo", sem diferenciar
// maiúsculas/minúsculas.
function contemAlgum(termos) {
  return termos.flatMap((termo) => [
    { titulo: { contains: termo, mode: "insensitive" } },
    { conteudo: { contains: termo, mode: "insensitive" } },
  ]);
}

export const listar = asyncHandler(async (req, res) => {
  const consulta = listarArtigosQuerySchema.safeParse(req.query);
  if (!consulta.success) return consultaInvalida(res, consulta);
  const { q, categoriaId } = consulta.data;

  const where = {
    ...(q && { OR: contemAlgum([q]) }),
    ...(categoriaId && { categoriaId }),
  };
  const artigos = await prisma.baseConhecimento.findMany({ where, include, orderBy: { createdAt: "desc" } });
  res.json(artigos);
});

// Artigos que podem resolver o problema descrito ao abrir um chamado. O banco
// traz quem contém alguma das palavras; a ordem e o corte em 5 vêm da pontuação
// em utils/sugestaoArtigos.js.
export const sugestoes = asyncHandler(async (req, res) => {
  const consulta = sugestoesQuerySchema.safeParse(req.query);
  if (!consulta.success) return consultaInvalida(res, consulta);
  const { texto, categoriaId = null } = consulta.data;

  const palavras = extrairPalavras(texto);
  if (palavras.length === 0) return res.json([]);

  const candidatos = await prisma.baseConhecimento.findMany({
    where: { OR: contemAlgum(termosDeBusca(texto)) },
    select: { id: true, titulo: true, conteudo: true, categoriaId: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: CANDIDATOS_SUGESTAO,
  });

  res.json(
    ordenarSugestoes(candidatos, palavras, categoriaId).map(({ id, titulo, conteudo, categoriaId: cat }) => ({
      id,
      titulo,
      categoriaId: cat,
      trecho: gerarTrecho(conteudo, palavras),
    }))
  );
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
