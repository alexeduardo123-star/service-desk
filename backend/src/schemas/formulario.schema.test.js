import { describe, it, expect } from "vitest";
import { formularioSchema } from "./formulario.schema.js";

const formularioValido = {
  nome: "Solicitação de acesso",
  campos: [
    { rotulo: "Sistema", tipo: "SELECAO", obrigatorio: true, opcoes: ["ERP", "CRM"] },
    { rotulo: "Justificativa", tipo: "TEXTO_LONGO" },
  ],
};

describe("formularioSchema", () => {
  it("aceita um formulário válido e numera a ordem dos campos", () => {
    const resultado = formularioSchema.safeParse(formularioValido);
    expect(resultado.success).toBe(true);
    expect(resultado.data.campos.map((campo) => campo.ordem)).toEqual([0, 1]);
    expect(resultado.data.campos[1]).toMatchObject({ obrigatorio: false, opcoes: [] });
  });

  it("descarta opções de campos que não são de seleção", () => {
    const resultado = formularioSchema.safeParse({
      nome: "Teste",
      campos: [{ rotulo: "Observação", tipo: "TEXTO", opcoes: ["a", "b"] }],
    });
    expect(resultado.data.campos[0].opcoes).toEqual([]);
  });

  it("remove opções vazias e repetidas da seleção", () => {
    const resultado = formularioSchema.safeParse({
      nome: "Teste",
      campos: [{ rotulo: "Turno", tipo: "SELECAO", opcoes: ["Manhã", " ", "Tarde", "Manhã"] }],
    });
    expect(resultado.data.campos[0].opcoes).toEqual(["Manhã", "Tarde"]);
  });

  it("exige pelo menos 2 opções em campos de seleção", () => {
    const resultado = formularioSchema.safeParse({
      nome: "Teste",
      campos: [{ rotulo: "Turno", tipo: "SELECAO", opcoes: ["Manhã"] }],
    });
    expect(resultado.success).toBe(false);
    expect(resultado.error.issues[0].message).toBe("Campos de seleção precisam de pelo menos 2 opções");
  });

  it("exige pelo menos um campo", () => {
    const resultado = formularioSchema.safeParse({ nome: "Vazio", campos: [] });
    expect(resultado.success).toBe(false);
    expect(resultado.error.issues[0].message).toBe("Adicione pelo menos um campo ao formulário");
  });

  it("rejeita tipo de campo desconhecido", () => {
    const resultado = formularioSchema.safeParse({ nome: "Teste", campos: [{ rotulo: "X", tipo: "ARQUIVO" }] });
    expect(resultado.success).toBe(false);
  });

  it("rejeita rótulos repetidos, ignorando maiúsculas", () => {
    const resultado = formularioSchema.safeParse({
      nome: "Teste",
      campos: [
        { rotulo: "Setor", tipo: "TEXTO" },
        { rotulo: "setor", tipo: "TEXTO" },
      ],
    });
    expect(resultado.success).toBe(false);
    expect(resultado.error.issues[0].message).toBe("Existem campos com o mesmo rótulo");
  });
});
