import { describe, it, expect } from "vitest";
import { montarFiltroTickets, montarOrdenacaoTickets, fechadosNoFim, ORDENS_VALIDAS } from "./filtrosTicket.js";

const ADMIN = { id: 1, papel: "ADMIN" };
const SOLICITANTE = { id: 9, papel: "SOLICITANTE" };

describe("montarFiltroTickets", () => {
  it("sem filtros devolve where vazio para a equipe", () => {
    expect(montarFiltroTickets({}, ADMIN)).toEqual({});
  });

  it("restringe o solicitante aos próprios chamados", () => {
    expect(montarFiltroTickets({}, SOLICITANTE)).toEqual({ solicitanteId: 9 });
  });

  it("solicitante não consegue escapar do próprio escopo via filtro", () => {
    const where = montarFiltroTickets({ tecnicoId: "me" }, SOLICITANTE);
    expect(where.solicitanteId).toBe(9);
  });

  it("aplica status, categoria e prioridade válidos", () => {
    const where = montarFiltroTickets({ status: "FECHADO", categoriaId: "2", prioridadeId: "3" }, ADMIN);
    expect(where).toEqual({ status: "FECHADO", categoriaId: 2, prioridadeId: 3 });
  });

  it("filtra pelo setor do chamado", () => {
    expect(montarFiltroTickets({ departamentoId: "4" }, ADMIN)).toEqual({ departamentoId: 4 });
  });

  it("ignora setor inválido", () => {
    for (const departamentoId of ["abc", "0", "-2", "1.5", ""]) {
      expect(montarFiltroTickets({ departamentoId }, ADMIN)).toEqual({});
    }
  });

  it("solicitante filtra por setor sem sair dos próprios chamados", () => {
    expect(montarFiltroTickets({ departamentoId: "4" }, SOLICITANTE)).toEqual({ solicitanteId: 9, departamentoId: 4 });
  });

  it("aceita o status de espera do usuário", () => {
    expect(montarFiltroTickets({ status: "AGUARDANDO_USUARIO" }, ADMIN)).toEqual({ status: "AGUARDANDO_USUARIO" });
  });

  it("aceita o status suspenso", () => {
    expect(montarFiltroTickets({ status: "SUSPENSO" }, ADMIN)).toEqual({ status: "SUSPENSO" });
  });

  it("ignora valores inválidos em vez de quebrar a query", () => {
    const where = montarFiltroTickets({ status: "QUALQUER", categoriaId: "abc", prioridadeId: "-1", tecnicoId: "xyz" }, ADMIN);
    expect(where).toEqual({});
  });

  it("entende tecnicoId=me, none e um id", () => {
    expect(montarFiltroTickets({ tecnicoId: "me" }, ADMIN).tecnicoId).toBe(1);
    expect(montarFiltroTickets({ tecnicoId: "none" }, ADMIN).tecnicoId).toBeNull();
    expect(montarFiltroTickets({ tecnicoId: "7" }, ADMIN).tecnicoId).toBe(7);
  });

  it("busca texto no título e na descrição", () => {
    const where = montarFiltroTickets({ q: "  notebook " }, ADMIN);
    expect(where.OR).toHaveLength(2);
    expect(where.OR[0].titulo.contains).toBe("notebook");
  });

  it("período: 'ate' só com data vai até o fim do dia", () => {
    const where = montarFiltroTickets({ de: "2026-10-01", ate: "2026-10-27" }, ADMIN);
    expect(where.createdAt.gte.toISOString()).toBe("2026-10-01T00:00:00.000Z");
    expect(where.createdAt.lte.toISOString()).toBe("2026-10-27T23:59:59.999Z");
  });

  it("ignora datas inválidas", () => {
    expect(montarFiltroTickets({ de: "ontem", ate: "amanhã" }, ADMIN)).toEqual({});
  });
});

function ticket(id, status, createdAt) {
  return { id, status, createdAt: new Date(createdAt) };
}

describe("montarOrdenacaoTickets", () => {
  it("sem ordem na query usa os mais antigos primeiro", () => {
    expect(montarOrdenacaoTickets()).toEqual({ ordem: "antigos", orderBy: { createdAt: "asc" } });
    expect(montarOrdenacaoTickets({})).toEqual({ ordem: "antigos", orderBy: { createdAt: "asc" } });
  });

  it("ordem=recentes inverte para os mais novos primeiro", () => {
    expect(montarOrdenacaoTickets({ ordem: "recentes" })).toEqual({
      ordem: "recentes",
      orderBy: { createdAt: "desc" },
    });
  });

  it("ordem=antigos é explicitamente aceita", () => {
    expect(montarOrdenacaoTickets({ ordem: "antigos" })).toEqual({
      ordem: "antigos",
      orderBy: { createdAt: "asc" },
    });
  });

  it("ordem inválida cai no padrão em vez de ir para o banco", () => {
    for (const ordem of ["", "qualquer", "createdAt desc", null, 0, ["recentes"]]) {
      expect(montarOrdenacaoTickets({ ordem })).toEqual({ ordem: "antigos", orderBy: { createdAt: "asc" } });
    }
  });

  it("só existem duas ordens possíveis", () => {
    expect(ORDENS_VALIDAS).toEqual(["antigos", "recentes"]);
  });
});

describe("fechadosNoFim", () => {
  it("manda os fechados para o fim da lista", () => {
    const tickets = [
      ticket(1, "FECHADO", "2026-11-01T10:00:00Z"),
      ticket(2, "ABERTO", "2026-11-02T10:00:00Z"),
      ticket(3, "FECHADO", "2026-11-03T10:00:00Z"),
      ticket(4, "EM_ANDAMENTO", "2026-11-04T10:00:00Z"),
    ];

    expect(fechadosNoFim(tickets).map((t) => t.id)).toEqual([2, 4, 1, 3]);
  });

  it("preserva a ordem por data que veio do banco dentro de cada grupo", () => {
    // Como o banco já devolve por createdAt asc, abertos e em andamento ficam
    // intercalados pela data — não agrupados por status.
    const tickets = [
      ticket(10, "ABERTO", "2026-11-01T10:00:00Z"),
      ticket(11, "EM_ANDAMENTO", "2026-11-02T10:00:00Z"),
      ticket(12, "FECHADO", "2026-11-03T10:00:00Z"),
      ticket(13, "ABERTO", "2026-11-04T10:00:00Z"),
      ticket(14, "FECHADO", "2026-11-05T10:00:00Z"),
    ];

    expect(fechadosNoFim(tickets).map((t) => t.id)).toEqual([10, 11, 13, 12, 14]);
  });

  it("mantém a ordem decrescente quando a listagem pede os mais recentes", () => {
    const tickets = [
      ticket(14, "FECHADO", "2026-11-05T10:00:00Z"),
      ticket(13, "ABERTO", "2026-11-04T10:00:00Z"),
      ticket(12, "FECHADO", "2026-11-03T10:00:00Z"),
      ticket(11, "EM_ANDAMENTO", "2026-11-02T10:00:00Z"),
    ];

    expect(fechadosNoFim(tickets).map((t) => t.id)).toEqual([13, 11, 14, 12]);
  });

  it("não altera a lista recebida", () => {
    const tickets = [ticket(1, "FECHADO", "2026-11-01T10:00:00Z"), ticket(2, "ABERTO", "2026-11-02T10:00:00Z")];

    const ordenados = fechadosNoFim(tickets);

    expect(tickets.map((t) => t.id)).toEqual([1, 2]);
    expect(ordenados).not.toBe(tickets);
  });

  it("aceita lista vazia e chamada sem argumento", () => {
    expect(fechadosNoFim([])).toEqual([]);
    expect(fechadosNoFim()).toEqual([]);
  });

  it("listas só de fechados ou só de abertos ficam intactas", () => {
    const fechados = [ticket(1, "FECHADO", "2026-11-01T10:00:00Z"), ticket(2, "FECHADO", "2026-11-02T10:00:00Z")];
    const abertos = [ticket(3, "ABERTO", "2026-11-01T10:00:00Z"), ticket(4, "EM_ANDAMENTO", "2026-11-02T10:00:00Z")];

    expect(fechadosNoFim(fechados).map((t) => t.id)).toEqual([1, 2]);
    expect(fechadosNoFim(abertos).map((t) => t.id)).toEqual([3, 4]);
  });
});
