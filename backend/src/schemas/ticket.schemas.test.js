import { describe, it, expect, vi } from "vitest";
import { validate } from "../middlewares/validate.js";
import { alterarStatusSchema, atribuirSchema, encaminharSchema, rejeitarSchema, suspenderSchema } from "./ticket.schemas.js";

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

describe("encaminharSchema", () => {
  it("aceita destino e motivo, tirando os espaços das pontas", () => {
    const { req, next } = run(encaminharSchema, { tecnicoId: 21, motivo: "  especialista em rede  " });
    expect(next).toHaveBeenCalled();
    expect(req.body).toEqual({ tecnicoId: 21, motivo: "especialista em rede" });
  });

  it("exige o atendente de destino", () => {
    for (const tecnicoId of [undefined, "21", 0, -1, 2.5]) {
      const { res, next } = run(encaminharSchema, { tecnicoId, motivo: "motivo válido" });
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    }
  });

  it("exige o motivo", () => {
    for (const body of [{ tecnicoId: 21 }, { tecnicoId: 21, motivo: "" }, { tecnicoId: 21, motivo: "    " }]) {
      const { res, next } = run(encaminharSchema, body);
      expect(next).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ erro: "Informe o motivo do encaminhamento" });
    }
  });

  it("motivo com menos de 5 caracteres (sem contar espaços das pontas) é recusado", () => {
    const { res } = run(encaminharSchema, { tecnicoId: 21, motivo: "  abc  " });
    expect(res.json).toHaveBeenCalledWith({ erro: "O motivo deve ter pelo menos 5 caracteres" });
    expect(run(encaminharSchema, { tecnicoId: 21, motivo: "abcde" }).next).toHaveBeenCalled();
  });

  it("motivo vai até 500 caracteres", () => {
    expect(run(encaminharSchema, { tecnicoId: 21, motivo: "x".repeat(500) }).next).toHaveBeenCalled();
    const { res } = run(encaminharSchema, { tecnicoId: 21, motivo: "x".repeat(501) });
    expect(res.json).toHaveBeenCalledWith({ erro: "O motivo deve ter no máximo 500 caracteres" });
  });
});

describe("rejeitarSchema", () => {
  it("exige o motivo da rejeição", () => {
    const { res, next } = run(rejeitarSchema, { motivo: "   " });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ erro: "Informe o motivo da rejeição" });
    expect(next).not.toHaveBeenCalled();
  });

  it("aceita e limpa os espaços do motivo", () => {
    const { req, next } = run(rejeitarSchema, { motivo: "  sem verba  " });
    expect(next).toHaveBeenCalled();
    expect(req.body.motivo).toBe("sem verba");
  });

  it("limita o tamanho do motivo", () => {
    const { res } = run(rejeitarSchema, { motivo: "x".repeat(1001) });
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
