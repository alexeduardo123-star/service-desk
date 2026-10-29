import { describe, it, expect } from "vitest";
import { montarFiltroTickets } from "./filtrosTicket.js";

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
