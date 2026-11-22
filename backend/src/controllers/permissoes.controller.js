import prisma from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { PERMISSOES, PAPEIS } from "../constants/permissoes.js";

export const listar = asyncHandler(async (_req, res) => {
  const permissoes = await prisma.permissao.findMany({ orderBy: [{ grupo: "asc" }, { nome: "asc" }] });
  const perfis = await prisma.perfilPermissao.findMany({ select: { papel: true, permissao: { select: { chave: true } } } });
  const porPapel = Object.fromEntries(PAPEIS.map((papel) => [papel, []]));
  for (const item of perfis) porPapel[item.papel]?.push(item.permissao.chave);
  res.json({ permissoes: permissoes.length ? permissoes : PERMISSOES, papeis: PAPEIS, permissoesPorPapel: porPapel });
});

export const atualizarPerfil = asyncHandler(async (req, res) => {
  const papel = String(req.params.papel || "").toUpperCase();
  const { permissoes } = req.body;
  if (!PAPEIS.includes(papel)) return res.status(400).json({ erro: "Perfil inválido" });
  if (!Array.isArray(permissoes) || permissoes.some((chave) => typeof chave !== "string")) {
    return res.status(400).json({ erro: "Informe uma lista válida de permissões" });
  }
  if (papel === "ADMIN") return res.status(400).json({ erro: "As permissões do Administrador são sempre completas" });

  const existentes = await prisma.permissao.findMany({ where: { chave: { in: permissoes } }, select: { id: true, chave: true } });
  if (existentes.length !== new Set(permissoes).size) return res.status(400).json({ erro: "Uma ou mais permissões são inválidas" });

  await prisma.$transaction([
    prisma.perfilPermissao.deleteMany({ where: { papel } }),
    ...existentes.map(({ id }) => prisma.perfilPermissao.create({ data: { papel, permissaoId: id } })),
  ]);
  res.json({ papel, permissoes: existentes.map(({ chave }) => chave) });
});
