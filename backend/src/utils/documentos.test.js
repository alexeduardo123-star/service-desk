import { describe, it, expect } from "vitest";
import { apenasDigitos, cnpjValido, normalizarTelefone, telefoneValido } from "./documentos";

describe("cnpjValido", () => {
  it("aceita CNPJ válido com ou sem máscara", () => {
    expect(cnpjValido("11.222.333/0001-81")).toBe(true);
    expect(cnpjValido("11222333000181")).toBe(true);
  });

  it("recusa dígito verificador errado, tamanho errado e sequências repetidas", () => {
    expect(cnpjValido("11.222.333/0001-82")).toBe(false);
    expect(cnpjValido("1122233300018")).toBe(false);
    expect(cnpjValido("112223330001811")).toBe(false);
    expect(cnpjValido("11.111.111/1111-11")).toBe(false);
    expect(cnpjValido("00000000000000")).toBe(false);
    expect(cnpjValido("")).toBe(false);
    expect(cnpjValido(undefined)).toBe(false);
  });
});

describe("normalizarTelefone", () => {
  it("devolve só dígitos para celular (11) e fixo (10), com qualquer máscara", () => {
    expect(normalizarTelefone("(49) 99999-9999")).toBe("49999999999");
    expect(normalizarTelefone("49 3333-4444")).toBe("4933334444");
    expect(normalizarTelefone("49999999999")).toBe("49999999999");
  });

  it("tira o 55 do país", () => {
    expect(normalizarTelefone("+55 (49) 99999-9999")).toBe("49999999999");
    expect(normalizarTelefone("554933334444")).toBe("4933334444");
  });

  it("recusa DDD inválido, falta de DDD, tamanho errado e prefixo impossível", () => {
    expect(normalizarTelefone("(09) 99999-9999")).toBeNull();
    expect(normalizarTelefone("99999-9999")).toBeNull();
    expect(normalizarTelefone("(49) 9999-999")).toBeNull();
    expect(normalizarTelefone("(49) 89999-9999")).toBeNull(); // 11 dígitos sem o 9 inicial
    expect(normalizarTelefone("(49) 9333-4444")).toBeNull(); // 10 dígitos começando com 9
    expect(normalizarTelefone("abc")).toBeNull();
    expect(normalizarTelefone("")).toBeNull();
  });
});

describe("outros", () => {
  it("telefoneValido e apenasDigitos", () => {
    expect(telefoneValido("(11) 98888-7777")).toBe(true);
    expect(telefoneValido("123")).toBe(false);
    expect(apenasDigitos("(11) 9-8888")).toBe("1198888");
    expect(apenasDigitos(null)).toBe("");
  });
});
