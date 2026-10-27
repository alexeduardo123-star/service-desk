import { describe, it, expect, vi } from "vitest";
import { validate } from "../middlewares/validate.js";
import { criarNotificacaoSchema, marcarLidaSchema } from "./notificacao.schemas.js";

function run(schema, body) {
  const req = { body };
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  const next = vi.fn();
  validate(schema)(req, res, next);
  return { req, res, next };
}

describe("criarNotificacaoSchema", () => {
  it("aceita comunicado para todos", () => {
    const { next } = run(criarNotificacaoSchema, { titulo: "Manutenção", mensagem: "Sistema fora às 22h", destino: { tipo: "TODOS" } });
    expect(next).toHaveBeenCalled();
  });

  it("aceita destino por papel e por usuário", () => {
    expect(run(criarNotificacaoSchema, { titulo: "Aviso", mensagem: "Olá", destino: { tipo: "PAPEL", papel: "TECNICO" } }).next).toHaveBeenCalled();
    expect(run(criarNotificacaoSchema, { titulo: "Aviso", mensagem: "Olá", destino: { tipo: "USUARIO", usuarioId: 3 } }).next).toHaveBeenCalled();
  });

  it("rejeita papel inexistente", () => {
    const { res } = run(criarNotificacaoSchema, { titulo: "Aviso", mensagem: "Olá", destino: { tipo: "PAPEL", papel: "CHEFE" } });
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("rejeita destino USUARIO sem usuarioId", () => {
    const { res } = run(criarNotificacaoSchema, { titulo: "Aviso", mensagem: "Olá", destino: { tipo: "USUARIO" } });
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("rejeita título curto", () => {
    const { res } = run(criarNotificacaoSchema, { titulo: "A", mensagem: "Olá", destino: { tipo: "TODOS" } });
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("marcarLidaSchema", () => {
  it("assume lida=true quando o corpo vem vazio", () => {
    const { req } = run(marcarLidaSchema, {});
    expect(req.body.lida).toBe(true);
  });

  it("rejeita valor que não é booleano", () => {
    const { res } = run(marcarLidaSchema, { lida: "sim" });
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
