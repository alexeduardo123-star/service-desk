import { describe, it, expect } from "vitest";
import { opcoesAssunto, prioridadeDoAssunto } from "./assunto";

const ASSUNTOS = [
  { id: 1, nome: "Novo acesso", ativo: true, servico: { nome: "Acessos" }, prioridadeId: 3 },
  { id: 2, nome: "Antigo", ativo: false, servico: { nome: "Acessos" }, prioridadeId: 1 },
  { id: 3, nome: "Sem serviço", ativo: true, prioridade: { id: 4 } },
  { id: 4, nome: "Sem prioridade", ativo: true },
];

describe("opcoesAssunto", () => {
  it("lista só os ativos, com o serviço no rótulo", () => {
    expect(opcoesAssunto(ASSUNTOS)).toEqual([
      { value: 1, label: "Acessos — Novo acesso" },
      { value: 3, label: "Sem serviço" },
      { value: 4, label: "Sem prioridade" },
    ]);
  });

  it("aceita lista vazia ou ausente", () => {
    expect(opcoesAssunto([])).toEqual([]);
    expect(opcoesAssunto()).toEqual([]);
  });
});

describe("prioridadeDoAssunto", () => {
  it("devolve a prioridade do assunto como texto", () => {
    expect(prioridadeDoAssunto(ASSUNTOS, "1")).toBe("3");
    expect(prioridadeDoAssunto(ASSUNTOS, 1)).toBe("3");
  });

  it("aceita a prioridade aninhada", () => {
    expect(prioridadeDoAssunto(ASSUNTOS, 3)).toBe("4");
  });

  it("devolve vazio quando o assunto não existe ou não tem prioridade", () => {
    expect(prioridadeDoAssunto(ASSUNTOS, 4)).toBe("");
    expect(prioridadeDoAssunto(ASSUNTOS, 99)).toBe("");
    expect(prioridadeDoAssunto(ASSUNTOS, "")).toBe("");
  });
});
