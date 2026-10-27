import { describe, expect, it } from "vitest";
import { formatarTelefone } from "./formatTelefone";

describe("formatarTelefone", () => {
  it("formata celular com 11 dígitos", () => {
    expect(formatarTelefone("49999990000")).toBe("(49) 99999-0000");
  });

  it("formata fixo com 10 dígitos", () => {
    expect(formatarTelefone("4933334444")).toBe("(49) 3333-4444");
  });

  it("aplica a máscara de forma progressiva", () => {
    expect(formatarTelefone("4")).toBe("(4");
    expect(formatarTelefone("499")).toBe("(49) 9");
  });

  it("remove caracteres não numéricos e limita a 11 dígitos", () => {
    expect(formatarTelefone("abc")).toBe("");
    expect(formatarTelefone("(49) 99999-0000999")).toBe("(49) 99999-0000");
  });

  it("aceita null e undefined", () => {
    expect(formatarTelefone(null)).toBe("");
    expect(formatarTelefone(undefined)).toBe("");
  });
});
