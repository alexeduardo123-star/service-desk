import prisma from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Cada usuário tem no máximo uma linha em configuracoes_usuario. Ela é criada
// de forma preguiçosa (com os defaults do schema) na primeira leitura, assim
// não precisa de backfill para usuários que já existiam.
export async function obterOuCriarConfiguracao(usuarioId) {
  return prisma.configuracaoUsuario.upsert({
    where: { usuarioId },
    update: {},
    create: { usuarioId },
  });
}

export const obter = asyncHandler(async (req, res) => {
  res.json(await obterOuCriarConfiguracao(req.user.id));
});

export const atualizar = asyncHandler(async (req, res) => {
  const configuracao = await prisma.configuracaoUsuario.upsert({
    where: { usuarioId: req.user.id },
    update: req.body,
    create: { usuarioId: req.user.id, ...req.body },
  });
  res.json(configuracao);
});

export const restaurarPadrao = asyncHandler(async (req, res) => {
  await prisma.configuracaoUsuario.deleteMany({ where: { usuarioId: req.user.id } });
  res.json(await obterOuCriarConfiguracao(req.user.id));
});
