import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../config/prisma.js", () => ({
  default: {
    formulario: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    assunto: { count: vi.fn() },
  },
}));

const prisma = (await import("../config/prisma.js")).default;
const { criar, atualizar, excluir } = await import("./formularios.controller.js");

function mockRes() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn(), send: vi.fn() };
}

function throwingNext(err) {
  if (err) throw err;
}

const campos = [{ rotulo: "Setor", tipo: "TEXTO", obrigatorio: true, opcoes: [], ordem: 0 }];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("formularios.controller", () => {
  it("cria o formulário junto com os campos", async () => {
    prisma.formulario.create.mockResolvedValue({ id: 1 });

    const res = mockRes();
    await criar({ body: { nome: "Acesso", descricao: null, ativo: true, campos } }, res, throwingNext);

    expect(prisma.formulario.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { nome: "Acesso", descricao: null, ativo: true, campos: { create: campos } },
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("substitui todos os campos ao atualizar", async () => {
    prisma.formulario.update.mockResolvedValue({ id: 3 });

    const res = mockRes();
    await atualizar({ params: { id: "3" }, body: { nome: "Acesso", ativo: true, campos } }, res, throwingNext);

    expect(prisma.formulario.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 3 },
        data: { nome: "Acesso", ativo: true, campos: { deleteMany: {}, create: campos } },
      })
    );
    expect(res.json).toHaveBeenCalledWith({ id: 3 });
  });

  it("não exclui formulário vinculado a assuntos", async () => {
    prisma.assunto.count.mockResolvedValue(2);

    const res = mockRes();
    await excluir({ params: { id: "1" } }, res, throwingNext);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(prisma.formulario.delete).not.toHaveBeenCalled();
  });

  it("exclui formulário sem vínculos", async () => {
    prisma.assunto.count.mockResolvedValue(0);
    prisma.formulario.delete.mockResolvedValue({});

    const res = mockRes();
    await excluir({ params: { id: "1" } }, res, throwingNext);

    expect(prisma.formulario.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(res.status).toHaveBeenCalledWith(204);
  });
});
