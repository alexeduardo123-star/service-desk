import { describe, expect, it } from "vitest";
import { dataDiasAtras, filtrosDoSalvo, limparFiltros, resumirFiltros, FILTROS_RELATORIO_VAZIOS } from "./relatorioFiltros";

describe("limparFiltros", () => {
  it("remove campos vazios e converte para texto", () => {
    expect(limparFiltros({ ...FILTROS_RELATORIO_VAZIOS, status: "FECHADO", categoriaId: 2 })).toEqual({ status: "FECHADO", categoriaId: "2" });
  });

  it("devolve objeto vazio quando nada foi preenchido", () => {
    expect(limparFiltros(FILTROS_RELATORIO_VAZIOS)).toEqual({});
  });
});

describe("filtrosDoSalvo", () => {
  it("completa os campos que faltam e ignora chaves desconhecidas", () => {
    const r = filtrosDoSalvo({ status: "ABERTO", antigo: "x" });
    expect(r).toEqual({ ...FILTROS_RELATORIO_VAZIOS, status: "ABERTO" });
  });

  it("aceita null/undefined", () => {
    expect(filtrosDoSalvo(null)).toEqual(FILTROS_RELATORIO_VAZIOS);
  });
});

describe("resumirFiltros / dataDiasAtras", () => {
  it("conta quantos filtros estão ativos", () => {
    expect(resumirFiltros({ ...FILTROS_RELATORIO_VAZIOS, de: "2026-10-01", q: "vpn" })).toBe(2);
  });

  it("calcula a data de N dias atrás", () => {
    expect(dataDiasAtras(30, new Date("2026-10-27T12:00:00Z"))).toBe("2026-09-27");
  });
});
