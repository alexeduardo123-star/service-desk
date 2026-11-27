import { describe, it, expect } from "vitest";
import { podeSerAtendente } from "./responsavelAssunto.js";

describe("podeSerAtendente", () => {
  it("aceita técnico e administrador ativos", () => {
    expect(podeSerAtendente({ papel: "TECNICO", ativo: true })).toBe(true);
    expect(podeSerAtendente({ papel: "ADMIN", ativo: true })).toBe(true);
  });

  it("recusa inexistente, inativo, gestor e solicitante", () => {
    expect(podeSerAtendente(null)).toBe(false);
    expect(podeSerAtendente({ papel: "TECNICO", ativo: false })).toBe(false);
    expect(podeSerAtendente({ papel: "GESTOR", ativo: true })).toBe(false);
    expect(podeSerAtendente({ papel: "SOLICITANTE", ativo: true })).toBe(false);
  });
});
