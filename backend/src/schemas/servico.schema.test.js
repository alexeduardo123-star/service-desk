import { describe, it, expect } from "vitest";
import { servicoSchema } from "./servico.schema.js";

describe("servicoSchema", () => {
  it("aceita um serviço válido e deixa ativo por padrão", () => {
    const resultado = servicoSchema.safeParse({ nome: "  Suporte de TI  " });
    expect(resultado.success).toBe(true);
    expect(resultado.data).toEqual({ nome: "Suporte de TI", descricao: null, ativo: true });
  });

  it("transforma descrição vazia em null", () => {
    const resultado = servicoSchema.safeParse({ nome: "Infraestrutura", descricao: "   " });
    expect(resultado.data.descricao).toBeNull();
  });

  it("rejeita nome muito curto", () => {
    const resultado = servicoSchema.safeParse({ nome: "A" });
    expect(resultado.success).toBe(false);
    expect(resultado.error.issues[0].message).toBe("Informe o nome do serviço");
  });

  it("rejeita ativo que não seja booleano", () => {
    expect(servicoSchema.safeParse({ nome: "Redes", ativo: "sim" }).success).toBe(false);
  });
});
