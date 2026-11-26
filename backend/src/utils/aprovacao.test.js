import { describe, it, expect } from "vitest";
import {
  statusInicialAprovacao,
  erroDeAprovacao,
  erroAoDecidir,
  podeDecidirAprovacao,
  comentarioDeAprovacao,
  comentarioDeRejeicao,
} from "./aprovacao.js";

describe("statusInicialAprovacao", () => {
  it("categoria que exige aprovação gera chamado pendente", () => {
    expect(statusInicialAprovacao({ exigeAprovacao: true })).toBe("PENDENTE");
  });

  it("categoria comum (ou ausente) não exige", () => {
    expect(statusInicialAprovacao({ exigeAprovacao: false })).toBe("NAO_EXIGIDA");
    expect(statusInicialAprovacao(null)).toBe("NAO_EXIGIDA");
  });
});

describe("erroDeAprovacao", () => {
  it("bloqueia o atendimento enquanto pendente ou rejeitado", () => {
    expect(erroDeAprovacao({ aprovacaoStatus: "PENDENTE" })).toMatch(/aguardando aprovação/);
    expect(erroDeAprovacao({ aprovacaoStatus: "REJEITADA" })).toMatch(/rejeitado/);
  });

  it("libera quando aprovado ou sem exigência", () => {
    expect(erroDeAprovacao({ aprovacaoStatus: "APROVADA" })).toBeNull();
    expect(erroDeAprovacao({ aprovacaoStatus: "NAO_EXIGIDA" })).toBeNull();
  });
});

describe("erroAoDecidir", () => {
  it("só decide chamado pendente", () => {
    expect(erroAoDecidir({ aprovacaoStatus: "PENDENTE" })).toBeNull();
    for (const aprovacaoStatus of ["APROVADA", "REJEITADA", "NAO_EXIGIDA"]) {
      expect(erroAoDecidir({ aprovacaoStatus })).toMatch(/não está aguardando/);
    }
  });
});

describe("podeDecidirAprovacao", () => {
  const ticket = { departamentoId: 3 };

  it("ADMIN decide qualquer chamado", () => {
    expect(podeDecidirAprovacao({ papel: "ADMIN", departamentoId: null }, ticket)).toBe(true);
    expect(podeDecidirAprovacao({ papel: "ADMIN" }, { departamentoId: null })).toBe(true);
  });

  it("gestor decide só os do seu setor", () => {
    expect(podeDecidirAprovacao({ papel: "GESTOR", departamentoId: 3 }, ticket)).toBe(true);
    expect(podeDecidirAprovacao({ papel: "GESTOR", departamentoId: 4 }, ticket)).toBe(false);
  });

  it("gestor sem setor, ou chamado sem setor, não decide", () => {
    expect(podeDecidirAprovacao({ papel: "GESTOR", departamentoId: null }, ticket)).toBe(false);
    expect(podeDecidirAprovacao({ papel: "GESTOR", departamentoId: 3 }, { departamentoId: null })).toBe(false);
    expect(podeDecidirAprovacao(null, ticket)).toBe(false);
  });
});

describe("comentários", () => {
  it("registram quem decidiu e o motivo", () => {
    expect(comentarioDeAprovacao("Ana")).toBe("Chamado aprovado por Ana.");
    expect(comentarioDeRejeicao("Ana", "sem verba")).toBe("Chamado rejeitado por Ana. Motivo: sem verba");
  });
});
