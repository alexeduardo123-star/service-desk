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

describe("fornecedorSchema: validações de CNPJ, telefone e e-mail", () => {
  const mensagem = (dados) => fornecedorSchema.safeParse({ ...fornecedorValido, ...dados }).error?.issues[0]?.message;

  it("pede o CNPJ quando vem vazio ou ausente", () => {
    expect(mensagem({ cnpj: "" })).toBe("Informe o CNPJ do fornecedor");
    expect(mensagem({ cnpj: undefined })).toBe("Informe o CNPJ do fornecedor");
  });

  it("explica CNPJ com dígito verificador errado", () => {
    expect(mensagem({ cnpj: "11.222.333/0001-82" })).toBe("CNPJ inválido: confira os 14 números");
  });

  it("guarda o telefone só com dígitos, sem o 55", () => {
    expect(fornecedorSchema.parse({ ...fornecedorValido, telefone: "+55 (49) 99999-9999" }).telefone).toBe("49999999999");
    expect(fornecedorSchema.parse({ ...fornecedorValido, telefone: "(49) 3333-4444" }).telefone).toBe("4933334444");
  });

  it("recusa telefone sem DDD ou com tamanho errado, com mensagem clara", () => {
    const esperado = "Telefone inválido: informe DDD e número, ex.: (49) 99999-9999";
    expect(mensagem({ telefone: "99999-9999" })).toBe(esperado);
    expect(mensagem({ telefone: "123" })).toBe(esperado);
    expect(mensagem({ telefone: "abc" })).toBe(esperado);
  });

  it("telefone é opcional (vazio ou null viram null)", () => {
    expect(fornecedorSchema.parse({ ...fornecedorValido, telefone: null }).telefone).toBeNull();
    expect(fornecedorSchema.parse({ ...fornecedorValido, telefone: "   " }).telefone).toBeNull();
    expect(fornecedorSchema.parse({ ...fornecedorValido, telefone: undefined }).telefone).toBeNull();
  });

  it("e-mail inválido tem mensagem clara e e-mail válido vai em minúsculas", () => {
    expect(mensagem({ email: "fornecedor@" })).toBe("E-mail inválido: use o formato nome@empresa.com");
    expect(fornecedorSchema.parse({ ...fornecedorValido, email: "  Contato@Empresa.COM " }).email).toBe("contato@empresa.com");
  });

  it("limita o tamanho de nome, contato e e-mail", () => {
    expect(mensagem({ nome: "a".repeat(121) })).toBe("O nome deve ter no máximo 120 caracteres");
    expect(mensagem({ contato: "a".repeat(121) })).toBe("O contato deve ter no máximo 120 caracteres");
    expect(mensagem({ email: `${"a".repeat(115)}@x.com` })).toBe("O e-mail deve ter no máximo 120 caracteres");
  });
});

