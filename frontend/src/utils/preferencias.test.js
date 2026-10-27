import { beforeEach, describe, expect, it } from "vitest";
import { lerPreferencias, salvarPreferencias, limparPreferencias, PREFERENCIAS_PADRAO } from "./preferencias";

describe("preferencias", () => {
  beforeEach(() => localStorage.clear());

  it("devolve os padrões quando nada foi salvo", () => {
    expect(lerPreferencias()).toEqual(PREFERENCIAS_PADRAO);
  });

  it("salva e lê itensPorPagina e fusoHorario", () => {
    salvarPreferencias({ itensPorPagina: 20, fusoHorario: "America/Manaus" });
    expect(lerPreferencias()).toEqual({ itensPorPagina: 20, fusoHorario: "America/Manaus" });
  });

  it("ignora campos que não são preferências de exibição", () => {
    salvarPreferencias({ notificarEmail: true, itensPorPagina: 5 });
    expect(lerPreferencias().notificarEmail).toBeUndefined();
    expect(lerPreferencias().itensPorPagina).toBe(5);
  });

  it("volta ao padrão depois de limpar", () => {
    salvarPreferencias({ itensPorPagina: 50 });
    limparPreferencias();
    expect(lerPreferencias()).toEqual(PREFERENCIAS_PADRAO);
  });

  it("não quebra com JSON inválido no storage", () => {
    localStorage.setItem("preferencias", "{quebrado");
    expect(lerPreferencias()).toEqual(PREFERENCIAS_PADRAO);
  });
});
