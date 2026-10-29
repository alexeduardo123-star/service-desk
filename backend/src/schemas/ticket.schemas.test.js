import { describe, it, expect, vi } from "vitest";
import { validate } from "../middlewares/validate.js";
import { alterarStatusSchema, atribuirSchema } from "./ticket.schemas.js";

function run(schema, body) {
  const req = { body };
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  const next = vi.fn();
  validate(schema)(req, res, next);
  return { req, res, next };
}

describe("alterarStatusSchema", () => {
  it("aceita os três status", () => {
    for (const status of ["ABERTO", "EM_ANDAMENTO", "FECHADO"]) {
      expect(run(alterarStatusSchema, { status }).next).toHaveBeenCalled();
    }
  });

  it("rejeita status desconhecido ou ausente", () => {
    expect(run(alterarStatusSchema, { status: "CANCELADO" }).res.status).toHaveBeenCalledWith(400);
    expect(run(alterarStatusSchema, {}).res.status).toHaveBeenCalledWith(400);
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
