import { describe, it, expect } from "vitest";
import { validarRespostas } from "./respostasFormulario.js";

const CAMPOS = [
  { id: 1, rotulo: "Sistema", tipo: "SELECAO", obrigatorio: true, opcoes: ["ERP", "CRM"] },
  { id: 2, rotulo: "Justificativa", tipo: "TEXTO_LONGO", obrigatorio: true, opcoes: [] },
  { id: 3, rotulo: "Desde quando?", tipo: "DATA", obrigatorio: false, opcoes: [] },
  { id: 4, rotulo: "Quantidade", tipo: "NUMERO", obrigatorio: false, opcoes: [] },
  { id: 5, rotulo: "Liga?", tipo: "CHECKBOX", obrigatorio: false, opcoes: [] },
];

const OK = { 1: "ERP", 2: "Preciso para o trabalho" };

describe("validarRespostas", () => {
  it("aceita respostas válidas e monta o histórico com o rótulo", () => {
    const { respostas, erro } = validarRespostas(CAMPOS, { ...OK, 3: "2026-11-20", 4: "3,5", 5: true });
    expect(erro).toBeUndefined();
    expect(respostas).toEqual([
      { campoId: 1, rotulo: "Sistema", tipo: "SELECAO", valor: "ERP" },
      { campoId: 2, rotulo: "Justificativa", tipo: "TEXTO_LONGO", valor: "Preciso para o trabalho" },
      { campoId: 3, rotulo: "Desde quando?", tipo: "DATA", valor: "2026-11-20" },
      { campoId: 4, rotulo: "Quantidade", tipo: "NUMERO", valor: 3.5 },
      { campoId: 5, rotulo: "Liga?", tipo: "CHECKBOX", valor: true },
    ]);
  });

  it("campos opcionais em branco viram null e checkbox desmarcado vira false", () => {
    const { respostas } = validarRespostas(CAMPOS, OK);
    expect(respostas.find((r) => r.campoId === 3).valor).toBeNull();
    expect(respostas.find((r) => r.campoId === 4).valor).toBeNull();
    expect(respostas.find((r) => r.campoId === 5).valor).toBe(false);
  });

  it("exige campo obrigatório preenchido (espaços não contam)", () => {
    expect(validarRespostas(CAMPOS, { 1: "ERP" }).erro).toBe('Preencha o campo "Justificativa"');
    expect(validarRespostas(CAMPOS, { 1: "ERP", 2: "   " }).erro).toBe('Preencha o campo "Justificativa"');
    expect(validarRespostas(CAMPOS, {}).erro).toBe('Preencha o campo "Sistema"');
  });

  it("checkbox obrigatório precisa estar marcado", () => {
    const campos = [{ id: 9, rotulo: "Li os termos", tipo: "CHECKBOX", obrigatorio: true }];
    expect(validarRespostas(campos, { 9: false }).erro).toBe('Marque "Li os termos" para continuar');
    expect(validarRespostas(campos, { 9: true }).respostas[0].valor).toBe(true);
    expect(validarRespostas(campos, { 9: "sim" }).erro).toMatch(/inválida/);
  });

  it("rejeita opção fora da lista, data inválida e número inválido", () => {
    expect(validarRespostas(CAMPOS, { ...OK, 1: "SAP" }).erro).toBe('Escolha uma opção válida em "Sistema"');
    expect(validarRespostas(CAMPOS, { ...OK, 3: "20/11/2026" }).erro).toBe('"Desde quando?" deve ser uma data válida');
    expect(validarRespostas(CAMPOS, { ...OK, 3: "2026-02-31" }).erro).toBe('"Desde quando?" deve ser uma data válida');
    expect(validarRespostas(CAMPOS, { ...OK, 4: "abc" }).erro).toBe('"Quantidade" deve ser um número');
  });

  it("limita o tamanho dos textos", () => {
    const campos = [{ id: 1, rotulo: "Nome", tipo: "TEXTO", obrigatorio: false }];
    expect(validarRespostas(campos, { 1: "x".repeat(501) }).erro).toMatch(/no máximo 500/);
    expect(validarRespostas(CAMPOS, { ...OK, 2: "x".repeat(2001) }).erro).toMatch(/no máximo 2000/);
  });

  it("ignora respostas de campos que não existem no formulário", () => {
    const { respostas } = validarRespostas(CAMPOS, { ...OK, 99: "intruso" });
    expect(respostas.some((r) => r.campoId === 99)).toBe(false);
  });

  it("rejeita corpo que não seja objeto", () => {
    expect(validarRespostas(CAMPOS, "texto").erro).toBe("Respostas do formulário inválidas");
    expect(validarRespostas(CAMPOS, [1, 2]).erro).toBe("Respostas do formulário inválidas");
    expect(validarRespostas(CAMPOS, null).erro).toBe("Respostas do formulário inválidas");
  });

  it("formulário sem campos gera lista vazia", () => {
    expect(validarRespostas([], {}).respostas).toEqual([]);
  });
});
