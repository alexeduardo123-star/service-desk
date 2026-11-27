import { describe, it, expect } from "vitest";
import { listarArtigosQuerySchema, sugestoesQuerySchema } from "./baseConhecimento.schemas.js";

describe("listarArtigosQuerySchema", () => {
  it("sem filtros é válido", () => {
    expect(listarArtigosQuerySchema.parse({})).toEqual({});
  });

  it("limpa a busca e converte a categoria", () => {
    expect(listarArtigosQuerySchema.parse({ q: "  vpn  ", categoriaId: "3" })).toEqual({ q: "vpn", categoriaId: 3 });
  });

  it("campos vazios valem como ausentes", () => {
    expect(listarArtigosQuerySchema.parse({ q: "", categoriaId: "" })).toEqual({});
  });

  it("recusa categoria inválida", () => {
    for (const categoriaId of ["abc", "0", "-2", "1.5"]) {
      const r = listarArtigosQuerySchema.safeParse({ categoriaId });
      expect(r.success).toBe(false);
      expect(r.error.issues[0].message).toBe("Categoria inválida");
    }
  });

  it("recusa busca longa demais ou repetida na URL", () => {
    expect(listarArtigosQuerySchema.safeParse({ q: "x".repeat(101) }).success).toBe(false);
    // ?q=a&q=b chega como array
    expect(listarArtigosQuerySchema.safeParse({ q: ["a", "b"] }).success).toBe(false);
  });
});

describe("sugestoesQuerySchema", () => {
  it("texto é opcional e vira string vazia", () => {
    expect(sugestoesQuerySchema.parse({})).toEqual({ texto: "" });
  });

  it("aceita texto e categoria", () => {
    expect(sugestoesQuerySchema.parse({ texto: "impressora travada", categoriaId: "5" })).toEqual({
      texto: "impressora travada",
      categoriaId: 5,
    });
  });

  it("recusa texto gigante e categoria inválida", () => {
    expect(sugestoesQuerySchema.safeParse({ texto: "x".repeat(5001) }).success).toBe(false);
    expect(sugestoesQuerySchema.safeParse({ texto: "vpn", categoriaId: "x" }).success).toBe(false);
  });
});
