import { describe, it, expect } from "vitest";
import { GRUPOS_CADASTROS, gruposVisiveis } from "./menuConfiguracoes";

const rotulos = (usuario) => gruposVisiveis(usuario).flatMap((g) => g.itens.map((i) => i.rotulo));

describe("gruposVisiveis", () => {
  it("administrador vê todos os cadastros, em três grupos", () => {
    const grupos = gruposVisiveis({ papel: "ADMIN" });

    expect(grupos.map((g) => g.titulo)).toEqual(["Acesso", "Atendimento", "Ativos e contratos"]);
    expect(rotulos({ papel: "ADMIN" })).toEqual([
      "Usuários",
      "Perfis e permissões",
      "Setores",
      "Categorias",
      "Prioridades",
      "Serviços",
      "Assuntos",
      "Formulários",
      "Equipamentos",
      "Fornecedores",
      "Contratos",
    ]);
  });

  it("o menu tem os 10 cadastros pedidos mais perfis e permissões, sem repetição", () => {
    const todos = GRUPOS_CADASTROS.flatMap((g) => g.itens.map((i) => i.to));
    expect(new Set(todos).size).toBe(todos.length);
    expect(todos).toHaveLength(11);
  });

  it("técnico só vê o que o perfil permite (ativos e contratos)", () => {
    const itens = rotulos({ papel: "TECNICO" });

    expect(itens).toEqual(expect.arrayContaining(["Equipamentos", "Fornecedores", "Contratos"]));
    expect(itens).not.toContain("Usuários");
    expect(itens).not.toContain("Assuntos");
    expect(gruposVisiveis({ papel: "TECNICO" }).map((g) => g.titulo)).toEqual(["Ativos e contratos"]);
  });

  it("solicitante não vê nenhum cadastro", () => {
    expect(gruposVisiveis({ papel: "SOLICITANTE" })).toEqual([]);
  });

  it("respeita ajustes de permissão do usuário", () => {
    const usuario = { papel: "SOLICITANTE", permissoes: ["cadastros.gerenciar"] };
    expect(rotulos(usuario)).toEqual(["Setores", "Categorias", "Prioridades", "Serviços", "Assuntos", "Formulários"]);
  });
});
