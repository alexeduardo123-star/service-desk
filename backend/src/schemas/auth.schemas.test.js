import { describe, it, expect, vi } from "vitest";
import { validate } from "../middlewares/validate.js";
import {
  registrarSchema,
  loginSchema,
  emailSchema,
  verificarEmailSchema,
  redefinirSenhaSchema,
} from "./auth.schemas.js";

function run(schema, body) {
  const req = { body };
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  const next = vi.fn();
  validate(schema)(req, res, next);
  return { req, res, next };
}

describe("registrarSchema", () => {
  it("rejeita quando faltam campos obrigatórios", () => {
    const { res, next } = run(registrarSchema, { email: "a@a.com" });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejeita senha curta", () => {
    const { res, next } = run(registrarSchema, { nome: "Ana", email: "a@a.com", senha: "123" });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejeita email inválido", () => {
    const { res } = run(registrarSchema, { nome: "Ana", email: "nao-e-email", senha: "123456" });
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("normaliza email (trim + lowercase) e libera dados válidos", () => {
    const { req, next } = run(registrarSchema, {
      nome: "Ana",
      email: "  Ana@Example.COM  ",
      senha: "123456",
    });
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.body.email).toBe("ana@example.com");
  });
});

describe("loginSchema", () => {
  it("exige senha não vazia", () => {
    const { res } = run(loginSchema, { email: "a@a.com", senha: "" });
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("emailSchema", () => {
  it("rejeita corpo sem email", () => {
    const { res } = run(emailSchema, {});
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("verificarEmailSchema", () => {
  it("rejeita código que não tem 6 dígitos", () => {
    const { res } = run(verificarEmailSchema, { email: "a@a.com", codigo: "123" });
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("aceita código de 6 dígitos", () => {
    const { next } = run(verificarEmailSchema, { email: "a@a.com", codigo: "123456" });
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe("redefinirSenhaSchema", () => {
  it("rejeita nova senha curta", () => {
    const { res } = run(redefinirSenhaSchema, { email: "a@a.com", codigo: "123456", novaSenha: "123" });
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
