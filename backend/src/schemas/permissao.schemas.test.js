import { describe, it, expect } from "vitest";
import { permissaoSchema } from "./permissao.schemas.js";

describe("permissaoSchema", () => {
  it("aceita perfil, permissão e valor válidos", () => {
    const r = permissaoSchema.safeParse({ papel: "GESTOR", permissao: "relatorios.ver", concedida: false });
    expect(r.success).toBe(true);
  });

  it("rejeita perfil inexistente", () => {
    const r = permissaoSchema.safeParse({ papel: "CHEFE", permissao: "relatorios.ver", concedida: true });
    expect(r.success).toBe(false);
  });

  it("rejeita permissão fora do catálogo", () => {
    const r = permissaoSchema.safeParse({ papel: "GESTOR", permissao: "apagar.tudo", concedida: true });
    expect(r.success).toBe(false);
  });

  it("exige concedida booleano", () => {
    const r = permissaoSchema.safeParse({ papel: "GESTOR", permissao: "relatorios.ver", concedida: "sim" });
    expect(r.success).toBe(false);
  });
});
