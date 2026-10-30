import { describe, it, expect, vi } from "vitest";
import { validate } from "../middlewares/validate.js";
import { relatorioSalvoSchema, relatorioSalvoAtualizacaoSchema } from "./relatorio.schemas.js";

function run(schema, body) {
  const req = { body };
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  const next = vi.fn();
  validate(schema)(req, res, next);
  return { req, res, next };
}

describe("relatorioSalvoSchema", () => {
  it("aceita nome e filtros", () => {
    const { req, next } = run(relatorioSalvoSchema, { nome: " Fechados do mês ", filtros: { status: "FECHADO", de: "2026-10-01" } });
    expect(next).toHaveBeenCalled();
    expect(req.body.nome).toBe("Fechados do mês");
  });

  it("usa filtros vazios quando não vêm", () => {
    const { req } = run(relatorioSalvoSchema, { nome: "Sem filtros" });
    expect(req.body.filtros).toEqual({});
  });

  it("descarta filtros desconhecidos", () => {
    const { req } = run(relatorioSalvoSchema, { nome: "Teste", filtros: { status: "ABERTO", hack: "x" } });
    expect(req.body.filtros).toEqual({ status: "ABERTO" });
  });

  it("rejeita nome curto ou ausente", () => {
    expect(run(relatorioSalvoSchema, { nome: "ab" }).res.status).toHaveBeenCalledWith(400);
    expect(run(relatorioSalvoSchema, {}).res.status).toHaveBeenCalledWith(400);
  });

  it("transforma descrição vazia em null", () => {
    expect(run(relatorioSalvoSchema, { nome: "Teste", descricao: "" }).req.body.descricao).toBeNull();
  });
});

describe("relatorioSalvoAtualizacaoSchema", () => {
  it("aceita atualização parcial", () => {
    expect(run(relatorioSalvoAtualizacaoSchema, { nome: "Novo nome" }).next).toHaveBeenCalled();
  });

  it("não inventa filtros vazios ao só renomear (preserva os salvos)", () => {
    const { req } = run(relatorioSalvoAtualizacaoSchema, { nome: "Novo nome" });
    expect(req.body.filtros).toBeUndefined();
  });

  it("rejeita corpo vazio", () => {
    expect(run(relatorioSalvoAtualizacaoSchema, {}).res.status).toHaveBeenCalledWith(400);
  });
});
