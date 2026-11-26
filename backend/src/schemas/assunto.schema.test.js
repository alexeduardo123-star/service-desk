import { describe, it, expect } from "vitest";
import { assuntoSchema } from "./assunto.schema.js";

const assuntoValido = { nome: "Instalação de software", servicoId: 1, prioridadeId: 2 };

describe("assuntoSchema", () => {
  it("aceita assunto sem formulário vinculado", () => {
    const resultado = assuntoSchema.safeParse(assuntoValido);
    expect(resultado.success).toBe(true);
    expect(resultado.data.formularioId).toBeNull();
    expect(resultado.data.ativo).toBe(true);
  });

  it("aceita formulário vinculado e converte ids em número", () => {
    const resultado = assuntoSchema.safeParse({ ...assuntoValido, servicoId: "2", formularioId: "5" });
    expect(resultado.data.servicoId).toBe(2);
    expect(resultado.data.formularioId).toBe(5);
  });

  it("aceita formularioId null para desvincular", () => {
    const resultado = assuntoSchema.safeParse({ ...assuntoValido, formularioId: null });
    expect(resultado.success).toBe(true);
    expect(resultado.data.formularioId).toBeNull();
  });

  it("exige um serviço", () => {
    const resultado = assuntoSchema.safeParse({ nome: "Sem serviço" });
    expect(resultado.success).toBe(false);
  });

  it("rejeita serviço com id inválido", () => {
    const resultado = assuntoSchema.safeParse({ ...assuntoValido, servicoId: 0 });
    expect(resultado.success).toBe(false);
    expect(resultado.error.issues[0].message).toBe("Selecione um serviço");
  });

  it("exige a prioridade do assunto", () => {
    const { prioridadeId, ...semPrioridade } = assuntoValido;
    const resultado = assuntoSchema.safeParse(semPrioridade);
    expect(resultado.success).toBe(false);
    expect(prioridadeId).toBe(2);
    expect(resultado.error.issues[0].message).toBe("Selecione a prioridade");
  });

  it("converte a prioridade em número e rejeita valor inválido", () => {
    expect(assuntoSchema.safeParse({ ...assuntoValido, prioridadeId: "3" }).data.prioridadeId).toBe(3);
    expect(assuntoSchema.safeParse({ ...assuntoValido, prioridadeId: 0 }).success).toBe(false);
    expect(assuntoSchema.safeParse({ ...assuntoValido, prioridadeId: "" }).success).toBe(false);
  });
});
