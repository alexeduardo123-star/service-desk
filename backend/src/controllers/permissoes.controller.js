import prisma from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { obterOverrides, limparCachePermissoes } from "../utils/permissoesCache.js";
import {
  PAPEIS,
  PERMISSOES,
  concedidaPorPadrao,
  montarMatriz,
  permissoesDoPapel,
} from "../utils/permissoes.js";

// Permissões do usuário logado (o front usa para esconder menus e botões).
export const minhas = asyncHandler(async (req, res) => {
  const overrides = await obterOverrides();
  res.json({ papel: req.user.papel, permissoes: permissoesDoPapel(req.user.papel, overrides) });
});

// Catálogo + matriz atual (perfil x permissão) para a tela de administração.
export const listar = asyncHandler(async (req, res) => {
  const overrides = await obterOverrides();
  res.json({
    papeis: PAPEIS,
    permissoes: Object.entries(PERMISSOES).map(([chave, p]) => ({ chave, rotulo: p.rotulo, grupo: p.grupo })),
    matriz: montarMatriz(overrides),
  });
});

export const atualizar = asyncHandler(async (req, res) => {
  const { papel, permissao, concedida } = req.body;

  if (papel === "ADMIN") {
    return res.status(400).json({ erro: "O perfil Administrador sempre tem todas as permissões" });
  }

  // Voltar ao valor padrão apaga o ajuste, em vez de guardar uma linha redundante.
  if (concedida === concedidaPorPadrao(papel, permissao)) {
    await prisma.perfilPermissao.deleteMany({ where: { papel, permissao } });
  } else {
    await prisma.perfilPermissao.upsert({
      where: { papel_permissao: { papel, permissao } },
      update: { concedida },
      create: { papel, permissao, concedida },
    });
  }

  limparCachePermissoes();
  const overrides = await obterOverrides();
  res.json({ papel, permissao, concedida, matriz: montarMatriz(overrides) });
});
