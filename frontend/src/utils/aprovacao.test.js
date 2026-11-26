import { describe, it, expect } from "vitest";
import { aguardandoAprovacao, bloqueadoPorAprovacao, podeDecidirAprovacao } from "./aprovacao";

describe("aprovação do gestor", () => {
  it("aguardandoAprovacao só vale para PENDENTE", () => {
    expect(aguardandoAprovacao({ aprovacaoStatus: "PENDENTE" })).toBe(true);
    for (const s of ["APROVADA", "REJEITADA", "NAO_EXIGIDA", undefined]) {
      expect(aguardandoAprovacao({ aprovacaoStatus: s })).toBe(false);
    }
    expect(aguardandoAprovacao(null)).toBe(false);
  });

  it("bloqueia o atendimento quando pendente ou rejeitado", () => {
    expect(bloqueadoPorAprovacao({ aprovacaoStatus: "PENDENTE" })).toBe(true);
    expect(bloqueadoPorAprovacao({ aprovacaoStatus: "REJEITADA" })).toBe(true);
    expect(bloqueadoPorAprovacao({ aprovacaoStatus: "APROVADA" })).toBe(false);
    expect(bloqueadoPorAprovacao({})).toBe(false);
  });

  it("só quem tem a permissão decide, e só chamado pendente", () => {
    const pendente = { aprovacaoStatus: "PENDENTE" };
    expect(podeDecidirAprovacao({ papel: "GESTOR" }, pendente)).toBe(true);
    expect(podeDecidirAprovacao({ papel: "ADMIN" }, pendente)).toBe(true);
    expect(podeDecidirAprovacao({ papel: "TECNICO" }, pendente)).toBe(false);
    expect(podeDecidirAprovacao({ papel: "GESTOR" }, { aprovacaoStatus: "APROVADA" })).toBe(false);
  });

  it("respeita a lista de permissões vinda do servidor", () => {
    const pendente = { aprovacaoStatus: "PENDENTE" };
    expect(podeDecidirAprovacao({ papel: "GESTOR", permissoes: [] }, pendente)).toBe(false);
    expect(podeDecidirAprovacao({ papel: "TECNICO", permissoes: ["tickets.aprovar"] }, pendente)).toBe(true);
  });
});
