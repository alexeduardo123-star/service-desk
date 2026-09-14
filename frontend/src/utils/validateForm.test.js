import { describe, expect, it } from "vitest";
import { validarEmail, validarCampoObrigatorio } from "./validateForm";

describe("validarEmail", () => {
  it("aceita emails válidos", () => {
    expect(validarEmail("usuario@servicedesk.com")).toBe(true);
    expect(validarEmail("a.b@dominio.co")).toBe(true);
  });

  it("rejeita emails inválidos", () => {
    expect(validarEmail("sem-arroba.com")).toBe(false);
    expect(validarEmail("com espaco@dominio.com")).toBe(false);
    expect(validarEmail("")).toBe(false);
  });
});

describe("validarCampoObrigatorio", () => {
  it("rejeita valores vazios, nulos ou só com espaço", () => {
    expect(validarCampoObrigatorio(undefined)).toBe(false);
    expect(validarCampoObrigatorio(null)).toBe(false);
    expect(validarCampoObrigatorio("")).toBe(false);
    expect(validarCampoObrigatorio("   ")).toBe(false);
  });

  it("aceita valores preenchidos", () => {
    expect(validarCampoObrigatorio("texto")).toBe(true);
    expect(validarCampoObrigatorio(0)).toBe(true);
    expect(validarCampoObrigatorio(123)).toBe(true);
  });
});
