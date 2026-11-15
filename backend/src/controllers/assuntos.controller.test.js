import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../config/prisma.js", () => ({
  default: {
    assunto: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    servico: { findUnique: vi.fn() },
    formulario: { findUnique: vi.fn() },
  },
}));

const prisma = (await import("../config/prisma.js")).default;
const { listar, buscar, criar, atualizar } = await import("./assuntos.controller.js");

function mockRes() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn(), send: vi.fn() };
}

function throwingNext(err) {
  if (err) throw err;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("assuntos.controller", () => {
  it("filtra a listagem pelo serviço informado", async () => {
    prisma.assunto.findMany.mockResolvedValue([]);

    const res = mockRes();
    await listar({ query: { servicoId: "4" } }, res, throwingNext);

    expect(prisma.assunto.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { servicoId: 4 } })
    );
  });

  it("rejeita filtro de serviço inválido", async () => {
    const res = mockRes();
    await listar({ query: { servicoId: "abc" } }, res, throwingNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(prisma.assunto.findMany).not.toHaveBeenCalled();
  });

  it("busca o assunto com os campos do formulário em ordem", async () => {
    prisma.assunto.findUnique.mockResolvedValue({ id: 1 });

    const res = mockRes();
    await buscar({ params: { id: "1" } }, res, throwingNext);

    const chamada = prisma.assunto.findUnique.mock.calls[0][0];
    expect(chamada.include.formulario).toEqual({ include: { campos: { orderBy: { ordem: "asc" } } } });
    expect(res.json).toHaveBeenCalledWith({ id: 1 });
  });

  it("cria assunto vinculado a serviço e formulário existentes", async () => {
    const dados = { nome: "Novo acesso", servicoId: 1, formularioId: 2, descricao: null, ativo: true };
    prisma.servico.findUnique.mockResolvedValue({ id: 1 });
    prisma.formulario.findUnique.mockResolvedValue({ id: 2 });
    prisma.assunto.create.mockResolvedValue({ id: 10, ...dados });

    const res = mockRes();
    await criar({ body: dados }, res, throwingNext);

    expect(prisma.assunto.create).toHaveBeenCalledWith(expect.objectContaining({ data: dados }));
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("não cria assunto com serviço inexistente", async () => {
    prisma.servico.findUnique.mockResolvedValue(null);

    const res = mockRes();
    await criar({ body: { nome: "X", servicoId: 9, formularioId: null } }, res, throwingNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ erro: "Serviço não encontrado" });
    expect(prisma.assunto.create).not.toHaveBeenCalled();
  });

  it("não vincula formulário inexistente", async () => {
    prisma.servico.findUnique.mockResolvedValue({ id: 1 });
    prisma.formulario.findUnique.mockResolvedValue(null);

    const res = mockRes();
    await atualizar({ params: { id: "1" }, body: { nome: "X", servicoId: 1, formularioId: 7 } }, res, throwingNext);

    expect(res.json).toHaveBeenCalledWith({ erro: "Formulário não encontrado" });
    expect(prisma.assunto.update).not.toHaveBeenCalled();
  });
});
