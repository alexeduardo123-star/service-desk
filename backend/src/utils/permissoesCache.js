import prisma from "../config/prisma.js";

// Os ajustes de permissão são lidos em quase toda requisição protegida, então
// ficam em memória por alguns segundos. Quem altera a matriz invalida o cache
// na hora (limparCachePermissoes); outras instâncias do servidor pegam a
// mudança no máximo depois do TTL.
const TTL_MS = 30_000;

let cache = { expiraEm: 0, overrides: [] };

export async function obterOverrides() {
  if (Date.now() < cache.expiraEm) return cache.overrides;
  const overrides = await prisma.perfilPermissao.findMany({
    select: { papel: true, permissao: true, concedida: true },
  });
  cache = { expiraEm: Date.now() + TTL_MS, overrides };
  return overrides;
}

export function limparCachePermissoes() {
  cache = { expiraEm: 0, overrides: [] };
}
