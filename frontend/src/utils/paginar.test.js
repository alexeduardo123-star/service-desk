import { describe, expect, it } from "vitest";
import { paginar } from "./paginar";

const lista = Array.from({ length: 23 }, (_, i) => i + 1);

describe("paginar", () => {
  it("devolve a primeira página", () => {
    const r = paginar(lista, 1, 10);
    expect(r.itens).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(r.totalPaginas).toBe(3);
    expect(r.total).toBe(23);
  });

  it("devolve a última página parcial", () => {
    expect(paginar(lista, 3, 10).itens).toEqual([21, 22, 23]);
  });

  it("prende a página ao intervalo válido", () => {
    expect(paginar(lista, 99, 10).pagina).toBe(3);
    expect(paginar(lista, 0, 10).pagina).toBe(1);
  });

  it("lida com lista vazia", () => {
    const r = paginar([], 1, 10);
    expect(r.itens).toEqual([]);
    expect(r.totalPaginas).toBe(1);
  });
});
