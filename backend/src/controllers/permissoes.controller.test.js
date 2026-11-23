import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../config/prisma.js", () => ({
  default: {
    perfilPermissao: { findMany: vi.fn(), upsert: vi.fn(), deleteMany: vi.fn() },
  },
}));

const prisma = (await import("../config/prisma.js")).default;
const { limparCachePermissoes } = await import("../utils/permissoesCache.js");
const { minhas, listar, atualizar } = await import("./permissoes.controller.js");

function mockRes() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn() };
}

function throwingNext(err) {
  if (err) throw err;
}

beforeEach(() => {
  vi.clearAllMocks();
  limparCachePermissoes();
  prisma.perfilPermissao.findMany.mockResolvedValue([]);
});

describe("permissoes.controller", () => {
  it("minhas devolve as permissões do perfil do usuário logado", async () => {
    const res = mockRes();
    await minhas({ user: { id: 1, papel: "GESTOR" } }, res, throwingNext);
    const corpo = res.json.mock.calls[0][0];
    expect(corpo.papel).toBe("GESTOR");
    expect(corpo.permissoes).toContain("relatorios.ver");
    expect(corpo.permissoes).not.toContain("usuarios.gerenciar");
  });

  it("listar devolve perfis, catálogo e matriz", async () => {
    const res = mockRes();
    await listar({}, res, throwingNext);
    const corpo = res.json.mock.calls[0][0];
    expect(corpo.papeis).toContain("GESTOR");
    expect(corpo.permissoes[0]).toMatchObject({ chave: expect.any(String), rotulo: expect.any(String), grupo: expect.any(String) });
    expect(corpo.matriz.ADMIN["usuarios.gerenciar"]).toBe(true);
    expect(corpo.matriz.SOLICITANTE["tickets.tratar"]).toBe(false);
  });

  it("não permite alterar o perfil Administrador", async () => {
    const res = mockRes();
    await atualizar({ body: { papel: "ADMIN", permissao: "tickets.tratar", concedida: false } }, res, throwingNext);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(prisma.perfilPermissao.upsert).not.toHaveBeenCalled();
    expect(prisma.perfilPermissao.deleteMany).not.toHaveBeenCalled();
  });

  it("grava o ajuste quando difere do padrão", async () => {
    const res = mockRes();
    await atualizar({ body: { papel: "SOLICITANTE", permissao: "relatorios.ver", concedida: true } }, res, throwingNext);
    expect(prisma.perfilPermissao.upsert).toHaveBeenCalledWith({
      where: { papel_permissao: { papel: "SOLICITANTE", permissao: "relatorios.ver" } },
      update: { concedida: true },
      create: { papel: "SOLICITANTE", permissao: "relatorios.ver", concedida: true },
    });
    expect(prisma.perfilPermissao.deleteMany).not.toHaveBeenCalled();
  });

  it("apaga o ajuste quando volta ao valor padrão", async () => {
    const res = mockRes();
    await atualizar({ body: { papel: "TECNICO", permissao: "tickets.tratar", concedida: true } }, res, throwingNext);
    expect(prisma.perfilPermissao.deleteMany).toHaveBeenCalledWith({
      where: { papel: "TECNICO", permissao: "tickets.tratar" },
    });
    expect(prisma.perfilPermissao.upsert).not.toHaveBeenCalled();
  });

  it("invalida o cache ao alterar (a matriz devolvida já reflete o banco)", async () => {
    prisma.perfilPermissao.findMany.mockResolvedValue([
      { papel: "TECNICO", permissao: "tickets.tratar", concedida: false },
    ]);
    const res = mockRes();
    await atualizar({ body: { papel: "TECNICO", permissao: "tickets.tratar", concedida: false } }, res, throwingNext);
    expect(res.json.mock.calls[0][0].matriz.TECNICO["tickets.tratar"]).toBe(false);
  });
});
