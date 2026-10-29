// Monta o `where` do Prisma para listar chamados a partir da query string.
// Usado pela listagem de chamados (lista e kanban) e pelos relatórios, assim
// os filtros se comportam igual nos dois lugares.

const STATUS_VALIDOS = ["ABERTO", "EM_ANDAMENTO", "FECHADO"];

function inteiroPositivo(valor) {
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function dataValida(valor) {
  if (!valor) return null;
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function montarFiltroTickets(query = {}, user) {
  const where = {};

  // Solicitante só enxerga os próprios chamados, independente dos filtros.
  if (user.papel === "SOLICITANTE") where.solicitanteId = user.id;

  if (STATUS_VALIDOS.includes(query.status)) where.status = query.status;

  const categoriaId = inteiroPositivo(query.categoriaId);
  if (categoriaId) where.categoriaId = categoriaId;

  const prioridadeId = inteiroPositivo(query.prioridadeId);
  if (prioridadeId) where.prioridadeId = prioridadeId;

  // tecnicoId=me -> meus chamados | tecnicoId=none -> sem técnico | tecnicoId=<id>
  if (query.tecnicoId === "me") where.tecnicoId = user.id;
  else if (query.tecnicoId === "none") where.tecnicoId = null;
  else if (inteiroPositivo(query.tecnicoId)) where.tecnicoId = inteiroPositivo(query.tecnicoId);

  const busca = typeof query.q === "string" ? query.q.trim() : "";
  if (busca) {
    where.OR = [
      { titulo: { contains: busca, mode: "insensitive" } },
      { descricao: { contains: busca, mode: "insensitive" } },
    ];
  }

  // Período pela data de abertura. "ate" é inclusivo (vai até o fim do dia
  // quando vem só a data, ex.: 2026-10-27).
  const de = dataValida(query.de);
  let ate = dataValida(query.ate);
  if (ate && /^\d{4}-\d{2}-\d{2}$/.test(query.ate)) ate = new Date(ate.getTime() + 24 * 60 * 60 * 1000 - 1);
  if (de || ate) {
    where.createdAt = {};
    if (de) where.createdAt.gte = de;
    if (ate) where.createdAt.lte = ate;
  }

  return where;
}
