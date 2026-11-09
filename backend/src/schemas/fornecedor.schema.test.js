import { describe, it, expect } from "vitest";
import { fornecedorSchema } from "./fornecedor.schema.js";

const fornecedorValido = {
  nome: "Fornecedor Exemplo",
  cnpj: "11.222.333/0001-81",
  contato: "Joao",
  telefone: "49999999999",
  email: "fornecedor@example.com",
};

describe("fornecedorSchema", () => {
  it("aceita um fornecedor valido", () => {
    const resultado = fornecedorSchema.safeParse(fornecedorValido);
    expect(resultado.success).toBe(true);
  });

  it("remove caracteres especiais do CNPJ", () => {
    const resultado = fornecedorSchema.safeParse(fornecedorValido);
    expect(resultado.data.cnpj).toBe("11222333000181");
  });

  it("rejeita CNPJ invalido", () => {
    const resultado = fornecedorSchema.safeParse({
      ...fornecedorValido,
      cnpj: "11.111.111/1111-11",
    });
    expect(resultado.success).toBe(false);
  });

  it("rejeita nome com menos de dois caracteres", () => {
    const resultado = fornecedorSchema.safeParse({
      ...fornecedorValido,
      nome: "A",
    });
    expect(resultado.success).toBe(false);
  });

  it("rejeita email invalido", () => {
    const resultado = fornecedorSchema.safeParse({
      ...fornecedorValido,
      email: "email-invalido",
    });
    expect(resultado.success).toBe(false);
  });

  it("define ativo como true por padrao", () => {
    const resultado = fornecedorSchema.safeParse(fornecedorValido);
    expect(resultado.data.ativo).toBe(true);
  });

  it("converte campos opcionais vazios em null", () => {
    const resultado = fornecedorSchema.safeParse({
      ...fornecedorValido,
      contato: "",
      telefone: "",
      email: "",
    });

    expect(resultado.success).toBe(true);
    expect(resultado.data.contato).toBe(null);
    expect(resultado.data.telefone).toBe(null);
    expect(resultado.data.email).toBe(null);
  });
});
