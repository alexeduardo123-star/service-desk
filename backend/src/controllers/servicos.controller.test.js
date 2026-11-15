import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../config/prisma.js", () => ({
  default: {
    servico: {
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
const { listar, buscar, excluir } = await import("./servicos.controller.js");

function mockRes() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn(), send: vi.fn() };
}

function throwingNext(err) {
  if (err) throw err;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("servicos.controller", () => {
  it("lista serviços com a contagem de assuntos", async () => {
    prisma.servico.findMany.mockResolvedValue([{ id: 1, nome: "TI", _count: { assuntos: 2 } }]);

    const res = mockRes();
    await listar({}, res, throwingNext);

    expect(prisma.servico.findMany).toHaveBeenCalledWith({
      include: { _count: { select: { assuntos: true } } },
      orderBy: { nome: "asc" },
    });
    expect(res.json).toHaveBeenCalledWith([{ id: 1, nome: "TI", _count: { assuntos: 2 } }]);
  });

  it("retorna 404 quando o serviço não existe", async () => {
    prisma.servico.findUnique.mockResolvedValue(null);

    const res = mockRes();
    await buscar({ params: { id: "99" } }, res, throwingNext);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("não exclui serviço que possui assuntos", async () => {
    prisma.assunto.count.mockResolvedValue(3);

    const res = mockRes();
    await excluir({ params: { id: "1" } }, res, throwingNext);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(prisma.servico.delete).not.toHaveBeenCalled();
  });

  it("exclui serviço sem assuntos", async () => {
    prisma.assunto.count.mockResolvedValue(0);
    prisma.servico.delete.mockResolvedValue({});

    const res = mockRes();
    await excluir({ params: { id: "1" } }, res, throwingNext);

    expect(prisma.servico.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(res.status).toHaveBeenCalledWith(204);
  });
});
