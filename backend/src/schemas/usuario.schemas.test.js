import { describe, it, expect, vi } from "vitest";
import { validate } from "../middlewares/validate.js";
import { perfilSchema, alterarSenhaSchema } from "./usuario.schemas.js";
import { configuracaoSchema } from "./configuracao.schemas.js";

function run(schema, body) {
  const req = { body };
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  const next = vi.fn();
  validate(schema)(req, res, next);
  return { req, res, next };
}

describe("perfilSchema", () => {
  it("aceita nome, telefone e cargo válidos", () => {
    const { req, next } = run(perfilSchema, { nome: " Ana Souza ", telefone: "(49) 99999-0000", cargo: "Analista" });
    expect(next).toHaveBeenCalled();
    expect(req.body.nome).toBe("Ana Souza");
  });

  it("transforma string vazia em null para limpar o campo", () => {
    const { req } = run(perfilSchema, { nome: "Ana", telefone: "", cargo: "" });
    expect(req.body.telefone).toBeNull();
    expect(req.body.cargo).toBeNull();
  });

  it("rejeita nome curto", () => {
    const { res, next } = run(perfilSchema, { nome: "A" });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejeita telefone com letras", () => {
    const { res } = run(perfilSchema, { nome: "Ana", telefone: "abc12345" });
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("alterarSenhaSchema", () => {
  it("rejeita nova senha curta", () => {
    const { res } = run(alterarSenhaSchema, { senhaAtual: "123456", novaSenha: "123" });
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("rejeita nova senha igual à atual", () => {
    const { res } = run(alterarSenhaSchema, { senhaAtual: "123456", novaSenha: "123456" });
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("aceita senhas válidas e diferentes", () => {
    const { next } = run(alterarSenhaSchema, { senhaAtual: "123456", novaSenha: "654321" });
    expect(next).toHaveBeenCalled();
  });
});

describe("configuracaoSchema", () => {
  it("aceita atualização parcial", () => {
    const { next } = run(configuracaoSchema, { notificarEmail: true });
    expect(next).toHaveBeenCalled();
  });

  it("rejeita itensPorPagina fora das opções", () => {
    const { res } = run(configuracaoSchema, { itensPorPagina: 7 });
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("rejeita fuso horário desconhecido", () => {
    const { res } = run(configuracaoSchema, { fusoHorario: "Mars/Olympus" });
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("ignora campos desconhecidos (não deixa gravar usuarioId)", () => {
    const { req } = run(configuracaoSchema, { usuarioId: 99, notificarStatus: false });
    expect(req.body.usuarioId).toBeUndefined();
    expect(req.body.notificarStatus).toBe(false);
  });
});
