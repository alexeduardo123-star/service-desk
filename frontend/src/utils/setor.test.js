import { describe, expect, it } from "vitest";
import { opcoesSetor, setorInicial } from "./setor";

describe("setorInicial", () => {
  it("usa o setor do usuário logado", () => {
    expect(setorInicial({ id: 1, departamentoId: 3 })).toBe("3");
  });

  it("fica vazio quando o usuário não tem setor", () => {
    expect(setorInicial({ id: 1, departamentoId: null })).toBe("");
    expect(setorInicial(null)).toBe("");
  });
});

describe("opcoesSetor", () => {
  it("monta as opções do select a partir dos departamentos", () => {
    expect(opcoesSetor([{ id: 1, nome: "TI" }, { id: 2, nome: "Financeiro" }])).toEqual([
      { value: 1, label: "TI" },
      { value: 2, label: "Financeiro" },
    ]);
    expect(opcoesSetor()).toEqual([]);
  });
});
