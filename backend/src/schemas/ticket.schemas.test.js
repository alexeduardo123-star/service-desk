import { describe, it, expect, vi } from "vitest";
import { validate } from "../middlewares/validate.js";
import { alterarStatusSchema, atribuirSchema, suspenderSchema } from "./ticket.schemas.js";

function run(schema, body) {
  const req = { body };
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  const next = vi.fn();
  validate(schema)(req, res, next);
  return { req, res, next };
}

describe("alterarStatusSchema", () => {
  it("aceita os status que podem ser escolhidos livremente", () => {
    for (const status of ["ABERTO", "EM_ANDAMENTO", "AGUARDANDO_USUARIO", "FECHADO"]) {
      expect(run(alterarStatusSchema, { status }).next).toHaveBeenCalled();
    }
  });

  it("rejeita status desconhecido ou ausente", () => {
    expect(run(alterarStatusSchema, { status: "CANCELADO" }).res.status).toHaveBeenCalledWith(400);
    expect(run(alterarStatusSchema, {}).res.status).toHaveBeenCalledWith(400);
  });

  it("recusa SUSPENSO: suspender exige motivo e tem rota própria", () => {
    expect(run(alterarStatusSchema, { status: "SUSPENSO" }).res.status).toHaveBeenCalledWith(400);
  });
});

describe("suspenderSchema", () => {
  it("aceita o motivo e tira os espaços das pontas", () => {
    const { req, next } = run(suspenderSchema, { motivo: "  aguardando peça do fornecedor  " });
    expect(next).toHaveBeenCalled();
    expect(req.body.motivo).toBe("aguardando peça do fornecedor");
  });

  it("exige o motivo", () => {
    for (const body of [{}, { motivo: "" }, { motivo: "   " }]) {
      const { res, next } = run(suspenderSchema, body);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ erro: "Informe o motivo da suspensão" });
    }
  });

  it("limita o tamanho do motivo", () => {
    expect(run(suspenderSchema, { motivo: "x".repeat(1001) }).res.status).toHaveBeenCalledWith(400);
  });
});

describe("atribuirSchema", () => {
  it("aceita um id inteiro positivo", () => {
    expect(run(atribuirSchema, { tecnicoId: 4 }).next).toHaveBeenCalled();
  });

  it("rejeita id inválido", () => {
    expect(run(atribuirSchema, { tecnicoId: 0 }).res.status).toHaveBeenCalledWith(400);
    expect(run(atribuirSchema, { tecnicoId: "4" }).res.status).toHaveBeenCalledWith(400);
  });
});
