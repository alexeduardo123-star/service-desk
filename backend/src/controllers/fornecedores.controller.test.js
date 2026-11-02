import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../config/prisma.js", () => ({
  default: {
    fornecedor: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

const prisma = (await import("../config/prisma.js")).default;
const { listar, buscar, criar, atualizar, excluir } = await import("./fornecedores.controller.js");

function mockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
    send: vi.fn(),
  };
}

function throwingNext(err) {
  if (err) throw err;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("fornecedores.controller", () => {
  it("lista fornecedores em ordem alfabética", async () => {
    const fornecedores = [{ id: 1, nome: "Acme" }];
    prisma.fornecedor.findMany.mockResolvedValue(fornecedores);

    const res = mockRes();
    await listar({}, res, throwingNext);

    expect(prisma.fornecedor.findMany).toHaveBeenCalledWith({
      orderBy: { nome: "asc" },
    });
    expect(res.json).toHaveBeenCalledWith(fornecedores);
  });

  it("retorna 404 quando o fornecedor não existe", async () => {
    prisma.fornecedor.findUnique.mockResolvedValue(null);

    const res = mockRes();
    await buscar({ params: { id: "999" } }, res, throwingNext);

    expect(prisma.fornecedor.findUnique).toHaveBeenCalledWith({
      where: { id: 999 },
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      erro: "Fornecedor não encontrado",
    });
  });

  it("retorna o fornecedor encontrado", async () => {
    const fornecedor = { id: 1, nome: "Acme" };
    prisma.fornecedor.findUnique.mockResolvedValue(fornecedor);

    const res = mockRes();
    await buscar({ params: { id: "1" } }, res, throwingNext);

    expect(res.json).toHaveBeenCalledWith(fornecedor);
  });

  it("cria um fornecedor e responde com status 201", async () => {
    const dados = { nome: "Acme" };
    const fornecedor = { id: 1, ...dados };
    prisma.fornecedor.create.mockResolvedValue(fornecedor);

    const res = mockRes();
    await criar({ body: dados }, res, throwingNext);

    expect(prisma.fornecedor.create).toHaveBeenCalledWith({ data: dados });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(fornecedor);
  });

  it("atualiza um fornecedor pelo ID", async () => {
    const dados = { nome: "Acme Atualizada" };
    const fornecedor = { id: 1, ...dados };
    prisma.fornecedor.update.mockResolvedValue(fornecedor);

    const res = mockRes();
    await atualizar({ params: { id: "1" }, body: dados }, res, throwingNext);

    expect(prisma.fornecedor.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: dados,
    });
    expect(res.json).toHaveBeenCalledWith(fornecedor);
  });

  it("exclui um fornecedor e responde com status 204", async () => {
    prisma.fornecedor.delete.mockResolvedValue({ id: 1 });

    const res = mockRes();
    await excluir({ params: { id: "1" } }, res, throwingNext);

    expect(prisma.fornecedor.delete).toHaveBeenCalledWith({
      where: { id: 1 },
    });
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });
});
