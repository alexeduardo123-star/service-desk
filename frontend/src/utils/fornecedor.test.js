import { describe, it, expect } from "vitest";
import { formatarCnpj, formatarTelefone, cnpjValido, telefoneValido, emailValido, validarFornecedor } from "./fornecedor";

describe("formatarCnpj", () => {
  it("aplica a máscara enquanto digita e ignora o que não é número", () => {
    expect(formatarCnpj("11")).toBe("11");
    expect(formatarCnpj("11222")).toBe("11.222");
    expect(formatarCnpj("11222333")).toBe("11.222.333");
    expect(formatarCnpj("112223330001")).toBe("11.222.333/0001");
    expect(formatarCnpj("11222333000181")).toBe("11.222.333/0001-81");
    expect(formatarCnpj("11.222.333/0001-81999")).toBe("11.222.333/0001-81");
    expect(formatarCnpj("ab")).toBe("");
  });
});

describe("formatarTelefone", () => {
  it("formata celular e fixo", () => {
    expect(formatarTelefone("")).toBe("");
    expect(formatarTelefone("4")).toBe("(4");
    expect(formatarTelefone("49")).toBe("(49");
    expect(formatarTelefone("499")).toBe("(49) 9");
    expect(formatarTelefone("4933334444")).toBe("(49) 3333-4444");
    expect(formatarTelefone("49999999999")).toBe("(49) 99999-9999");
    expect(formatarTelefone("4999999999999")).toBe("(49) 99999-9999");
  });

  it("tira o +55 quando colam um número completo", () => {
    expect(formatarTelefone("+55 49 99999-9999")).toBe("(49) 99999-9999");
  });
});

describe("cnpjValido (igual ao backend)", () => {
  it("valida dígitos verificadores e recusa sequências repetidas", () => {
    expect(cnpjValido("11.222.333/0001-81")).toBe(true);
    expect(cnpjValido("11.222.333/0001-82")).toBe(false);
    expect(cnpjValido("11111111111111")).toBe(false);
    expect(cnpjValido("123")).toBe(false);
  });
});

describe("telefoneValido (igual ao backend)", () => {
  it("aceita celular com 9 e fixo, com ou sem 55", () => {
    expect(telefoneValido("(49) 99999-9999")).toBe(true);
    expect(telefoneValido("(49) 3333-4444")).toBe(true);
    expect(telefoneValido("+55 49 99999-9999")).toBe(true);
  });

  it("recusa sem DDD, DDD inválido e tamanhos errados", () => {
    expect(telefoneValido("99999-9999")).toBe(false);
    expect(telefoneValido("(09) 99999-9999")).toBe(false);
    expect(telefoneValido("(49) 89999-9999")).toBe(false);
    expect(telefoneValido("(49) 9333-4444")).toBe(false);
    expect(telefoneValido("123")).toBe(false);
  });
});

describe("emailValido", () => {
  it("confere o formato básico", () => {
    expect(emailValido("a@empresa.com")).toBe(true);
    expect(emailValido("a@empresa")).toBe(false);
    expect(emailValido("a empresa.com")).toBe(false);
    expect(emailValido("")).toBe(false);
  });
});

describe("validarFornecedor", () => {
  const ok = { nome: "Acme", cnpj: "11.222.333/0001-81", contato: "", telefone: "", email: "" };

  it("sem problemas devolve objeto vazio (contato, telefone e e-mail são opcionais)", () => {
    expect(validarFornecedor(ok)).toEqual({});
    expect(validarFornecedor({ ...ok, telefone: "(49) 99999-9999", email: "a@acme.com" })).toEqual({});
  });

  it("devolve uma mensagem clara por campo com problema", () => {
    expect(validarFornecedor({ nome: "", cnpj: "", telefone: "123", email: "x@" })).toEqual({
      nome: "Informe o nome do fornecedor",
      cnpj: "Informe o CNPJ do fornecedor",
      telefone: "Telefone inválido: informe DDD e número, ex.: (49) 99999-9999",
      email: "E-mail inválido: use o formato nome@empresa.com",
    });
    expect(validarFornecedor({ ...ok, cnpj: "11.222.333/0001-82" }).cnpj).toBe("CNPJ inválido: confira os 14 números");
  });

  it("limites de tamanho", () => {
    expect(validarFornecedor({ ...ok, nome: "a".repeat(121) }).nome).toMatch(/no máximo 120/);
    expect(validarFornecedor({ ...ok, contato: "a".repeat(121) }).contato).toMatch(/no máximo 120/);
  });
});
