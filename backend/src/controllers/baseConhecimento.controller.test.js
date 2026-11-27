import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../config/prisma.js", () => ({
  default: { baseConhecimento: { findMany: vi.fn() } },
}));

const prisma = (await import("../config/prisma.js")).default;
const { listar, sugestoes } = await import("./baseConhecimento.controller.js");
const { default: router } = await import("../routes/baseConhecimento.routes.js");

function mockRes() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn() };
}

function throwingNext(err) {
  if (err) throw err;
}

const USUARIO = { id: 1, nome: "Ana", papel: "SOLICITANTE" };

beforeEach(() => {
  vi.clearAllMocks();
  prisma.baseConhecimento.findMany.mockResolvedValue([]);
});

describe("baseConhecimento.controller: listar", () => {
  it("sem filtros lista tudo do mais novo para o mais antigo", async () => {
    await listar({ query: {}, user: USUARIO }, mockRes(), throwingNext);

    const args = prisma.baseConhecimento.findMany.mock.calls[0][0];
    expect(args.where).toEqual({});
    expect(args.orderBy).toEqual({ createdAt: "desc" });
  });

  it("busca no título ou no conteúdo sem diferenciar maiúsculas e filtra a categoria", async () => {
    await listar({ query: { q: " VPN ", categoriaId: "3" }, user: USUARIO }, mockRes(), throwingNext);

    expect(prisma.baseConhecimento.findMany.mock.calls[0][0].where).toEqual({
      OR: [
        { titulo: { contains: "VPN", mode: "insensitive" } },
        { conteudo: { contains: "VPN", mode: "insensitive" } },
      ],
      categoriaId: 3,
    });
  });

  it("query inválida dá 400 sem ir ao banco", async () => {
    const res = mockRes();

    await listar({ query: { categoriaId: "abc" }, user: USUARIO }, res, throwingNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ erro: "Categoria inválida" });
    expect(prisma.baseConhecimento.findMany).not.toHaveBeenCalled();
  });
});

describe("baseConhecimento.controller: sugestoes", () => {
  it("busca as palavras (com e sem acento) e devolve os mais relevantes com trecho", async () => {
    prisma.baseConhecimento.findMany.mockResolvedValue([
      { id: 1, titulo: "Rede lenta", conteudo: "A impressão pela rede demora.", categoriaId: 2, createdAt: "2026-11-01" },
      { id: 2, titulo: "Impressão travada", conteudo: "Reinicie o spooler.", categoriaId: 5, createdAt: "2026-10-01" },
    ]);
    const res = mockRes();

    await sugestoes({ query: { texto: "A impressão não sai", categoriaId: "5" }, user: USUARIO }, res, throwingNext);

    const args = prisma.baseConhecimento.findMany.mock.calls[0][0];
    const termos = args.where.OR.map((c) => c.titulo?.contains ?? c.conteudo?.contains);
    expect(new Set(termos)).toEqual(new Set(["impressao", "impressão", "sai"]));
    expect(args.where.OR[0].titulo.mode).toBe("insensitive");
    expect(args.take).toBe(50);

    // O 2 tem a palavra no título e é da mesma categoria; o 1 só no conteúdo.
    expect(res.json).toHaveBeenCalledWith([
      { id: 2, titulo: "Impressão travada", categoriaId: 5, trecho: "Reinicie o spooler." },
      { id: 1, titulo: "Rede lenta", categoriaId: 2, trecho: "A impressão pela rede demora." },
    ]);
  });

  it("sem palavras relevantes devolve vazio sem consultar o banco", async () => {
    const res = mockRes();

    await sugestoes({ query: { texto: "Olá, bom dia" }, user: USUARIO }, res, throwingNext);

    expect(res.json).toHaveBeenCalledWith([]);
    expect(prisma.baseConhecimento.findMany).not.toHaveBeenCalled();
  });

  it("devolve no máximo 5", async () => {
    prisma.baseConhecimento.findMany.mockResolvedValue(
      Array.from({ length: 9 }, (_, i) => ({ id: i + 1, titulo: `VPN ${i}`, conteudo: "", categoriaId: null, createdAt: "2026-11-01" }))
    );
    const res = mockRes();

    await sugestoes({ query: { texto: "vpn" }, user: USUARIO }, res, throwingNext);

    expect(res.json.mock.calls[0][0]).toHaveLength(5);
  });

  it("query inválida dá 400", async () => {
    const res = mockRes();

    await sugestoes({ query: { texto: "vpn", categoriaId: "-1" }, user: USUARIO }, res, throwingNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(prisma.baseConhecimento.findMany).not.toHaveBeenCalled();
  });
});

describe("baseConhecimento.routes", () => {
  it("declara /sugestoes antes de /:id", () => {
    const rotasGet = router.stack.filter((l) => l.route?.methods.get).map((l) => l.route.path);
    expect(rotasGet.indexOf("/sugestoes")).toBeGreaterThanOrEqual(0);
    expect(rotasGet.indexOf("/sugestoes")).toBeLessThan(rotasGet.indexOf("/:id"));
  });
});
