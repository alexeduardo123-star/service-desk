import { describe, it, expect } from "vitest";
import {
  PAPEIS,
  CHAVES_PERMISSAO,
  concedidaPorPadrao,
  papelTemPermissao,
  permissoesDoPapel,
  montarMatriz,
} from "./permissoes.js";

describe("permissoes", () => {
  it("ADMIN sempre tem todas as permissões, mesmo com ajuste contrário", () => {
    const overrides = [{ papel: "ADMIN", permissao: "tickets.tratar", concedida: false }];
    expect(papelTemPermissao("ADMIN", "tickets.tratar", overrides)).toBe(true);
    expect(permissoesDoPapel("ADMIN")).toHaveLength(CHAVES_PERMISSAO.length);
  });

  it("usa o padrão do código quando não há ajuste", () => {
    expect(papelTemPermissao("TECNICO", "tickets.tratar")).toBe(true);
    expect(papelTemPermissao("GESTOR", "relatorios.ver")).toBe(true);
    expect(papelTemPermissao("SOLICITANTE", "tickets.tratar")).toBe(false);
    expect(papelTemPermissao("TECNICO", "usuarios.gerenciar")).toBe(false);
  });

  it("o ajuste do administrador vale por cima do padrão", () => {
    const liberar = [{ papel: "SOLICITANTE", permissao: "relatorios.ver", concedida: true }];
    const bloquear = [{ papel: "TECNICO", permissao: "tickets.tratar", concedida: false }];
    expect(papelTemPermissao("SOLICITANTE", "relatorios.ver", liberar)).toBe(true);
    expect(papelTemPermissao("TECNICO", "tickets.tratar", bloquear)).toBe(false);
    // ajuste de outro perfil não interfere
    expect(papelTemPermissao("GESTOR", "tickets.tratar", bloquear)).toBe(true);
  });

  it("papel ou permissão desconhecidos nunca são autorizados", () => {
    expect(papelTemPermissao("VISITANTE", "tickets.tratar")).toBe(false);
    expect(papelTemPermissao("TECNICO", "naoexiste")).toBe(false);
  });

  it("concedidaPorPadrao ignora ajustes", () => {
    expect(concedidaPorPadrao("TECNICO", "equipamentos.gerenciar")).toBe(true);
    expect(concedidaPorPadrao("GESTOR", "equipamentos.gerenciar")).toBe(false);
  });

  it("monta a matriz com todos os perfis e permissões", () => {
    const matriz = montarMatriz([{ papel: "GESTOR", permissao: "base.gerenciar", concedida: false }]);
    expect(Object.keys(matriz)).toEqual(PAPEIS);
    expect(Object.keys(matriz.GESTOR)).toEqual(CHAVES_PERMISSAO);
    expect(matriz.GESTOR["base.gerenciar"]).toBe(false);
    expect(matriz.TECNICO["base.gerenciar"]).toBe(true);
  });
});
