import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.JWT_SECRET = "segredo-de-teste";

vi.mock("../config/prisma.js", () => ({
  default: { perfilPermissao: { findMany: vi.fn() } },
}));

const prisma = (await import("../config/prisma.js")).default;
const { limparCachePermissoes } = await import("../utils/permissoesCache.js");
const { requirePermissao } = await import("./auth.js");

function mockRes() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn() };
}

async function executar(middleware, user) {
  const res = mockRes();
  const next = vi.fn();
  await middleware({ user }, res, next);
  return { res, next };
}

beforeEach(() => {
  vi.clearAllMocks();
  limparCachePermissoes();
  prisma.perfilPermissao.findMany.mockResolvedValue([]);
});

describe("requirePermissao", () => {
  it("libera quando o perfil tem a permissão por padrão", async () => {
    const { res, next } = await executar(requirePermissao("tickets.tratar"), { id: 1, papel: "TECNICO" });
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("responde 403 quando o perfil não tem a permissão", async () => {
    const { res, next } = await executar(requirePermissao("tickets.tratar"), { id: 1, papel: "SOLICITANTE" });
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("responde 403 sem usuário autenticado", async () => {
    const { res, next } = await executar(requirePermissao("tickets.tratar"), undefined);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("respeita o ajuste do administrador gravado no banco", async () => {
    prisma.perfilPermissao.findMany.mockResolvedValue([
      { papel: "SOLICITANTE", permissao: "relatorios.ver", concedida: true },
    ]);
    const { next } = await executar(requirePermissao("relatorios.ver"), { id: 5, papel: "SOLICITANTE" });
    expect(next).toHaveBeenCalledOnce();
  });

  it("aceita qualquer uma das permissões informadas", async () => {
    const { next } = await executar(
      requirePermissao("usuarios.gerenciar", "relatorios.ver"),
      { id: 2, papel: "GESTOR" }
    );
    expect(next).toHaveBeenCalledOnce();
  });

  it("guarda os ajustes em cache até a invalidação", async () => {
    const mw = requirePermissao("tickets.tratar");
    await executar(mw, { id: 1, papel: "TECNICO" });
    await executar(mw, { id: 1, papel: "TECNICO" });
    expect(prisma.perfilPermissao.findMany).toHaveBeenCalledTimes(1);

    limparCachePermissoes();
    await executar(mw, { id: 1, papel: "TECNICO" });
    expect(prisma.perfilPermissao.findMany).toHaveBeenCalledTimes(2);
  });

  it("encaminha falha do banco para o tratador de erros", async () => {
    prisma.perfilPermissao.findMany.mockRejectedValue(new Error("banco fora"));
    const res = mockRes();
    const next = vi.fn();
    await requirePermissao("tickets.tratar")({ user: { id: 1, papel: "TECNICO" } }, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
