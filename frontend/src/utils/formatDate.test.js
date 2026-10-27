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

describe("formatDate com fuso horário das preferências", () => {
  it("respeita o fuso configurado pelo usuário", () => {
    localStorage.setItem("preferencias", JSON.stringify({ fusoHorario: "UTC" }));
    expect(formatDate("2026-03-05T14:30:00Z")).toContain("14:30");
    localStorage.setItem("preferencias", JSON.stringify({ fusoHorario: "America/Sao_Paulo" }));
    expect(formatDate("2026-03-05T14:30:00Z")).toContain("11:30");
    localStorage.clear();
  });

  it("não quebra quando o fuso salvo é inválido", () => {
    localStorage.setItem("preferencias", JSON.stringify({ fusoHorario: "Marte/Olimpo" }));
    expect(formatDate("2026-03-05T14:30:00Z")).toMatch(/^\d{2}\/\d{2}\/\d{4}/);
    localStorage.clear();
  });
});
