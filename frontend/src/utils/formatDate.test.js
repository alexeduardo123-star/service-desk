import { describe, expect, it } from "vitest";
import { formatDate } from "./formatDate";

describe("formatDate", () => {
  it("retorna '-' quando não recebe data", () => {
    expect(formatDate(null)).toBe("-");
    expect(formatDate(undefined)).toBe("-");
    expect(formatDate("")).toBe("-");
  });

  it("formata uma data ISO no padrão pt-BR", () => {
    const resultado = formatDate("2026-03-05T14:30:00Z");
    expect(resultado).toMatch(/^\d{2}\/\d{2}\/\d{4}/);
  });
});
