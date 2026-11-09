import { describe, it, expect } from "vitest";
import { contratoSchema } from "./contrato.schema.js";

const contratoValido = {
  titulo: "Manutencao preventiva",
  fornecedorId: 1,
  equipamentoId: 1,
  inicio: "2026-01-01",
  fim: "2026-12-31",
  valor: 1500,
  observacoes: "Contrato de manutencao",
};

describe("contratoSchema", () => {
  it("aceita um contrato valido", () => {
    const resultado = contratoSchema.safeParse(contratoValido);
    expect(resultado.success).toBe(true);
  });

  it("define status ATIVO por padrao", () => {
    const resultado = contratoSchema.safeParse(contratoValido);
    expect(resultado.data.status).toBe("ATIVO");
  });

  it("rejeita titulo muito curto", () => {
    const resultado = contratoSchema.safeParse({
      ...contratoValido,
      titulo: "AB",
    });
    expect(resultado.success).toBe(false);
  });

  it("rejeita fornecedor com ID invalido", () => {
    const resultado = contratoSchema.safeParse({
      ...contratoValido,
      fornecedorId: 0,
    });
    expect(resultado.success).toBe(false);
  });

  it("rejeita equipamento com ID invalido", () => {
    const resultado = contratoSchema.safeParse({
      ...contratoValido,
      equipamentoId: -1,
    });
    expect(resultado.success).toBe(false);
  });

  it("rejeita valor igual a zero", () => {
    const resultado = contratoSchema.safeParse({
      ...contratoValido,
      valor: 0,
    });
    expect(resultado.success).toBe(false);
  });

  it("rejeita data final anterior a data inicial", () => {
    const resultado = contratoSchema.safeParse({
      ...contratoValido,
      inicio: "2026-12-31",
      fim: "2026-01-01",
    });
    expect(resultado.success).toBe(false);
  });

  it("rejeita datas invalidas", () => {
    const resultado = contratoSchema.safeParse({
      ...contratoValido,
      inicio: "data-invalida",
    });
    expect(resultado.success).toBe(false);
  });

  it("aceita os status permitidos", () => {
    for (const status of ["ATIVO", "ENCERRADO", "SUSPENSO"]) {
      const resultado = contratoSchema.safeParse({
        ...contratoValido,
        status,
      });
      expect(resultado.success).toBe(true);
    }
  });
});
