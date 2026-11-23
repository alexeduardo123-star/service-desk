import { describe, it, expect } from "vitest";
import { temPermissao, temAlgumaPermissao } from "./permissoes";

describe("temPermissao", () => {
  it("ADMIN tem qualquer permissão", () => {
    expect(temPermissao({ papel: "ADMIN" }, "usuarios.gerenciar")).toBe(true);
    expect(temPermissao({ papel: "ADMIN", permissoes: [] }, "tickets.tratar")).toBe(true);
  });

  it("usa a lista que veio do servidor quando existe", () => {
    const usuario = { papel: "SOLICITANTE", permissoes: ["relatorios.ver"] };
    expect(temPermissao(usuario, "relatorios.ver")).toBe(true);
    expect(temPermissao(usuario, "tickets.tratar")).toBe(false);
    // lista do servidor vale mesmo que o padrão do perfil fosse diferente
    expect(temPermissao({ papel: "TECNICO", permissoes: [] }, "tickets.tratar")).toBe(false);
  });

  it("sem lista, cai no padrão do perfil", () => {
    expect(temPermissao({ papel: "TECNICO" }, "tickets.tratar")).toBe(true);
    expect(temPermissao({ papel: "GESTOR" }, "equipamentos.gerenciar")).toBe(false);
    expect(temPermissao({ papel: "SOLICITANTE" }, "tickets.tratar")).toBe(false);
  });

  it("sem usuário nunca autoriza", () => {
    expect(temPermissao(null, "tickets.tratar")).toBe(false);
    expect(temPermissao(undefined, "tickets.tratar")).toBe(false);
  });

  it("temAlgumaPermissao aceita qualquer uma da lista", () => {
    const usuario = { papel: "GESTOR" };
    expect(temAlgumaPermissao(usuario, ["usuarios.gerenciar", "relatorios.ver"])).toBe(true);
    expect(temAlgumaPermissao(usuario, ["usuarios.gerenciar"])).toBe(false);
  });
});
