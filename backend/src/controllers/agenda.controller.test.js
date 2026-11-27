import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../config/prisma.js", () => ({
  default: {
    agendamento: { findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    ticket: { findMany: vi.fn(), findUnique: vi.fn() },
    usuario: { findUnique: vi.fn() },
  },
}));
vi.mock("../utils/permissoesCache.js", () => ({ obterOverrides: vi.fn().mockResolvedValue([]) }));

const prisma = (await import("../config/prisma.js")).default;
const { listar, criar, atualizar, excluir } = await import("./agenda.controller.js");

const TECNICO = { id: 20, nome: "Téc", papel: "TECNICO" };
const GESTOR = { id: 30, nome: "Gestora", papel: "GESTOR" };
const DADOS = {
  titulo: "Visita",
  descricao: null,
  inicio: new Date("2026-11-02T10:00:00Z"),
  fim: new Date("2026-11-02T11:00:00Z"),
  ticketId: null,
};

const mockRes = () => ({ status: vi.fn().mockReturnThis(), json: vi.fn(), send: vi.fn() });
const next = (err) => {
  if (err) throw err;
};

beforeEach(() => {
  vi.clearAllMocks();
  prisma.usuario.findUnique.mockResolvedValue({ papel: "TECNICO", ativo: true });
  prisma.agendamento.findFirst.mockResolvedValue(null);
  prisma.ticket.findUnique.mockResolvedValue({ id: 5 });
  prisma.agendamento.create.mockImplementation(async ({ data }) => ({ id: 1, ...data }));
  prisma.agendamento.update.mockImplementation(async ({ data }) => ({ id: 1, ...data }));
});

describe("agenda.controller: listar", () => {
  it("devolve prazos de SLA e agendamentos do período", async () => {
    prisma.agendamento.findMany.mockResolvedValue([{ id: 1 }]);
    prisma.ticket.findMany.mockResolvedValue([
      { id: 7, titulo: "VPN", status: "ABERTO", createdAt: "2026-11-02T10:00:00Z", prioridade: { id: 2, nome: "Alta", slaHoras: 8 }, tecnico: null },
    ]);
    const res = mockRes();

    await listar({ query: { inicio: "2026-11-02T00:00:00Z", fim: "2026-11-03T00:00:00Z" } }, res, next);

    const corpo = res.json.mock.calls[0][0];
    expect(corpo.agendamentos).toEqual([{ id: 1 }]);
    expect(corpo.prazos).toHaveLength(1);
    expect(corpo.prazos[0]).toMatchObject({ ticketId: 7, titulo: "VPN" });
    expect(prisma.ticket.findMany.mock.calls[0][0].where.status).toEqual({ notIn: ["FECHADO", "SUSPENSO"] });
  });

  it("filtra por atendente os agendamentos e os chamados dele", async () => {
    prisma.agendamento.findMany.mockResolvedValue([]);
    prisma.ticket.findMany.mockResolvedValue([]);

    await listar({ query: { inicio: "2026-11-02", fim: "2026-11-03", atendenteId: "20" } }, mockRes(), next);

    expect(prisma.agendamento.findMany.mock.calls[0][0].where).toMatchObject({ atendenteId: 20 });
    expect(prisma.ticket.findMany.mock.calls[0][0].where).toMatchObject({ tecnicoId: 20 });
  });

  it("recusa período ausente ou grande demais", async () => {
    const res = mockRes();
    await listar({ query: {} }, res, next);
    expect(res.status).toHaveBeenCalledWith(400);

    const res2 = mockRes();
    await listar({ query: { inicio: "2026-01-01", fim: "2026-12-31" } }, res2, next);
    expect(res2.json).toHaveBeenCalledWith({ erro: "O período pode ter no máximo 62 dias" });
    expect(prisma.agendamento.findMany).not.toHaveBeenCalled();
  });
});

describe("agenda.controller: criar", () => {
  it("sem atendente, agenda para quem está criando", async () => {
    const res = mockRes();
    await criar({ body: DADOS, user: TECNICO }, res, next);

    expect(prisma.agendamento.create.mock.calls[0][0].data).toMatchObject({ atendenteId: 20, criadoPorId: 20 });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("técnico não agenda na agenda de outra pessoa", async () => {
    const res = mockRes();
    await criar({ body: { ...DADOS, atendenteId: 21 }, user: TECNICO }, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(prisma.agendamento.create).not.toHaveBeenCalled();
  });

  it("gestor (agenda.todos) agenda para outro atendente", async () => {
    const res = mockRes();
    await criar({ body: { ...DADOS, atendenteId: 21 }, user: GESTOR }, res, next);

    expect(prisma.agendamento.create.mock.calls[0][0].data).toMatchObject({ atendenteId: 21, criadoPorId: 30 });
  });

  it("recusa atendente inativo ou sem perfil de atendimento", async () => {
    prisma.usuario.findUnique.mockResolvedValue({ papel: "SOLICITANTE", ativo: true });
    const res = mockRes();

    await criar({ body: { ...DADOS, atendenteId: 21 }, user: GESTOR }, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(prisma.agendamento.create).not.toHaveBeenCalled();
  });

  it("recusa chamado inexistente", async () => {
    prisma.ticket.findUnique.mockResolvedValue(null);
    const res = mockRes();

    await criar({ body: { ...DADOS, ticketId: 99 }, user: TECNICO }, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ erro: "Chamado não encontrado" });
  });

  it("recusa horário que conflita com outro atendimento do mesmo atendente (409)", async () => {
    prisma.agendamento.findFirst.mockResolvedValue({ titulo: "Reunião" });
    const res = mockRes();

    await criar({ body: DADOS, user: TECNICO }, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ erro: "O atendente já tem um atendimento nesse horário: Reunião" });
    expect(prisma.agendamento.findFirst.mock.calls[0][0].where).toMatchObject({
      atendenteId: 20,
      inicio: { lt: DADOS.fim },
      fim: { gt: DADOS.inicio },
    });
    expect(prisma.agendamento.create).not.toHaveBeenCalled();
  });
});

describe("agenda.controller: atualizar e excluir", () => {
  const EXISTENTE = { id: 1, atendenteId: 20 };

  it("o dono altera o próprio atendimento e o conflito ignora ele mesmo", async () => {
    prisma.agendamento.findUnique.mockResolvedValue(EXISTENTE);

    await atualizar({ params: { id: "1" }, body: DADOS, user: TECNICO }, mockRes(), next);

    expect(prisma.agendamento.update).toHaveBeenCalled();
    expect(prisma.agendamento.findFirst.mock.calls[0][0].where).toMatchObject({ id: { not: 1 } });
  });

  it("outro técnico não altera nem cancela o atendimento", async () => {
    prisma.agendamento.findUnique.mockResolvedValue({ id: 1, atendenteId: 21 });
    const res = mockRes();
    await atualizar({ params: { id: "1" }, body: DADOS, user: TECNICO }, res, next);
    expect(res.status).toHaveBeenCalledWith(403);

    const res2 = mockRes();
    await excluir({ params: { id: "1" }, user: TECNICO }, res2, next);
    expect(res2.status).toHaveBeenCalledWith(403);
    expect(prisma.agendamento.update).not.toHaveBeenCalled();
    expect(prisma.agendamento.delete).not.toHaveBeenCalled();
  });

  it("técnico não repassa o atendimento para outro atendente", async () => {
    prisma.agendamento.findUnique.mockResolvedValue(EXISTENTE);
    const res = mockRes();

    await atualizar({ params: { id: "1" }, body: { ...DADOS, atendenteId: 21 }, user: TECNICO }, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("gestor cancela o atendimento de qualquer atendente", async () => {
    prisma.agendamento.findUnique.mockResolvedValue({ atendenteId: 21 });
    const res = mockRes();

    await excluir({ params: { id: "1" }, user: GESTOR }, res, next);

    expect(prisma.agendamento.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it("404 quando o agendamento não existe", async () => {
    prisma.agendamento.findUnique.mockResolvedValue(null);
    const res = mockRes();

    await atualizar({ params: { id: "9" }, body: DADOS, user: TECNICO }, res, next);
    await excluir({ params: { id: "9" }, user: TECNICO }, mockRes(), next);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
