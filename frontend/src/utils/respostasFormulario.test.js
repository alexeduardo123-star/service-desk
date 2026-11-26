import { describe, it, expect } from "vitest";
import { respostasIniciais, validarRespostas, formatarResposta } from "./respostasFormulario";

const CAMPOS = [
  { id: 1, rotulo: "Sistema", tipo: "SELECAO", obrigatorio: true, opcoes: ["ERP"] },
  { id: 2, rotulo: "Obs", tipo: "TEXTO", obrigatorio: false },
  { id: 3, rotulo: "Liga?", tipo: "CHECKBOX", obrigatorio: false },
  { id: 4, rotulo: "Termos", tipo: "CHECKBOX", obrigatorio: true },
];

describe("respostasIniciais", () => {
  it("começa vazio, com caixas desmarcadas", () => {
    expect(respostasIniciais(CAMPOS)).toEqual({ 1: "", 2: "", 3: false, 4: false });
    expect(respostasIniciais()).toEqual({});
  });
});

describe("validarRespostas", () => {
  it("avisa do primeiro obrigatório em branco", () => {
    expect(validarRespostas(CAMPOS, respostasIniciais(CAMPOS))).toBe('Preencha o campo "Sistema"');
  });

  it("espaços não contam como preenchido", () => {
    expect(validarRespostas(CAMPOS, { 1: "   ", 4: true })).toBe('Preencha o campo "Sistema"');
  });

  it("checkbox obrigatório precisa estar marcado", () => {
    expect(validarRespostas(CAMPOS, { 1: "ERP", 4: false })).toBe('Marque "Termos" para continuar');
  });

  it("devolve null quando está tudo certo", () => {
    expect(validarRespostas(CAMPOS, { 1: "ERP", 4: true })).toBeNull();
  });

  it("sem campos não há o que validar", () => {
    expect(validarRespostas([], {})).toBeNull();
    expect(validarRespostas()).toBeNull();
  });
});

describe("formatarResposta", () => {
  it("mostra Sim/Não, data em português e textos como estão", () => {
    expect(formatarResposta({ tipo: "CHECKBOX", valor: true })).toBe("Sim");
    expect(formatarResposta({ tipo: "CHECKBOX", valor: false })).toBe("Não");
    expect(formatarResposta({ tipo: "DATA", valor: "2026-11-20" })).toBe("20/11/2026");
    expect(formatarResposta({ tipo: "NUMERO", valor: 3.5 })).toBe("3.5");
    expect(formatarResposta({ tipo: "TEXTO", valor: "olá" })).toBe("olá");
  });

  it("campo sem resposta aparece como traço", () => {
    expect(formatarResposta({ tipo: "TEXTO", valor: null })).toBe("—");
    expect(formatarResposta({ tipo: "DATA", valor: "" })).toBe("—");
  });
});
