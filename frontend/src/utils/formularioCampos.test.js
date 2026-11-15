import { describe, expect, it } from "vitest";
import {
  formularioParaEdicao,
  formularioVazio,
  montarPayload,
  moverCampo,
  novoCampo,
  opcoesDoTexto,
  validarFormulario,
} from "./formularioCampos";

const campo = (dados) => ({ ...novoCampo(), ...dados });

describe("formularioCampos", () => {
  it("começa um formulário novo com um campo de texto", () => {
    const form = formularioVazio();
    expect(form).toMatchObject({ id: null, nome: "", ativo: true });
    expect(form.campos).toHaveLength(1);
    expect(form.campos[0].tipo).toBe("TEXTO");
  });

  it("gera chaves diferentes para cada campo", () => {
    expect(novoCampo().chave).not.toBe(novoCampo().chave);
  });

  it("separa opções por linha, sem vazias nem repetidas", () => {
    expect(opcoesDoTexto(" ERP \n\nCRM\nERP\n")).toEqual(["ERP", "CRM"]);
    expect(opcoesDoTexto(undefined)).toEqual([]);
  });

  it("converte um formulário salvo para edição", () => {
    const form = formularioParaEdicao({
      id: 3,
      nome: "Acesso",
      descricao: null,
      ativo: false,
      campos: [{ id: 9, rotulo: "Sistema", tipo: "SELECAO", obrigatorio: true, opcoes: ["ERP", "CRM"] }],
    });
    expect(form).toMatchObject({ id: 3, nome: "Acesso", descricao: "", ativo: false });
    expect(form.campos[0]).toMatchObject({ rotulo: "Sistema", opcoesTexto: "ERP\nCRM" });
  });

  it("monta o payload só com opções em campos de seleção", () => {
    const payload = montarPayload({
      nome: "  Acesso ",
      descricao: " ",
      ativo: true,
      campos: [
        campo({ rotulo: " Sistema ", tipo: "SELECAO", obrigatorio: true, opcoesTexto: "ERP\nCRM" }),
        campo({ rotulo: "Motivo", tipo: "TEXTO_LONGO", opcoesTexto: "sobrou" }),
      ],
    });
    expect(payload).toEqual({
      nome: "Acesso",
      descricao: null,
      ativo: true,
      campos: [
        { rotulo: "Sistema", tipo: "SELECAO", obrigatorio: true, opcoes: ["ERP", "CRM"] },
        { rotulo: "Motivo", tipo: "TEXTO_LONGO", obrigatorio: false, opcoes: [] },
      ],
    });
  });

  describe("validarFormulario", () => {
    const valido = () => ({ nome: "Acesso", descricao: "", ativo: true, campos: [campo({ rotulo: "Sistema" })] });

    it("aceita um formulário válido", () => {
      expect(validarFormulario(valido())).toBeNull();
    });

    it("exige nome", () => {
      expect(validarFormulario({ ...valido(), nome: " " })).toBe("Informe o nome do formulário");
    });

    it("exige pelo menos um campo", () => {
      expect(validarFormulario({ ...valido(), campos: [] })).toBe("Adicione pelo menos um campo ao formulário");
    });

    it("exige rótulo em todos os campos", () => {
      expect(validarFormulario({ ...valido(), campos: [campo({ rotulo: "  " })] })).toBe(
        "Informe o rótulo de todos os campos"
      );
    });

    it("exige 2 opções em campos de seleção", () => {
      const form = { ...valido(), campos: [campo({ rotulo: "Turno", tipo: "SELECAO", opcoesTexto: "Manhã" })] };
      expect(validarFormulario(form)).toBe('O campo "Turno" precisa de pelo menos 2 opções');
    });

    it("não aceita rótulos repetidos", () => {
      const form = { ...valido(), campos: [campo({ rotulo: "Setor" }), campo({ rotulo: "SETOR" })] };
      expect(validarFormulario(form)).toBe("Existem campos com o mesmo rótulo");
    });
  });

  it("move campos para cima e para baixo sem sair dos limites", () => {
    const lista = ["a", "b", "c"];
    expect(moverCampo(lista, 1, -1)).toEqual(["b", "a", "c"]);
    expect(moverCampo(lista, 1, 1)).toEqual(["a", "c", "b"]);
    expect(moverCampo(lista, 0, -1)).toBe(lista);
    expect(moverCampo(lista, 2, 1)).toBe(lista);
  });
});
