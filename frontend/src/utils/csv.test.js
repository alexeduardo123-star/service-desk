import { describe, expect, it } from "vitest";
import { gerarCsv } from "./csv";

const COLUNAS = [
  { rotulo: "Id", valor: (l) => l.id },
  { rotulo: "Título", valor: (l) => l.titulo },
];

describe("gerarCsv", () => {
  it("começa com BOM e usa ; e quebra de linha CRLF", () => {
    const csv = gerarCsv(COLUNAS, [{ id: 1, titulo: "Monitor" }]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv.slice(1)).toBe("Id;Título\r\n1;Monitor");
  });

  it("coloca entre aspas e escapa aspas internas", () => {
    const csv = gerarCsv(COLUNAS, [{ id: 1, titulo: 'Erro "grave"; urgente' }]);
    expect(csv).toContain('"Erro ""grave""; urgente"');
  });

  it("protege contra fórmulas (CSV injection)", () => {
    const csv = gerarCsv(COLUNAS, [{ id: 1, titulo: "=HYPERLINK(\"http://x\")" }]);
    expect(csv).toContain("'=HYPERLINK");
  });

  it("trata null e undefined como vazio", () => {
    const csv = gerarCsv(COLUNAS, [{ id: 2, titulo: null }]);
    expect(csv.endsWith("2;")).toBe(true);
  });

  it("gera só o cabeçalho quando não há linhas", () => {
    expect(gerarCsv(COLUNAS, []).slice(1)).toBe("Id;Título");
  });
});
