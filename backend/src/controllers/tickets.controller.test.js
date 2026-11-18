import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../config/prisma.js", () => ({
  default: {
    ticket: { findUnique: vi.fn(), update: vi.fn() },
    comentario: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("../utils/eventosTicket.js", async (original) => ({
  // Mantém as regras puras de verdade e só espiona os avisos, que vão ao banco.
  ...(await original()),
  avisarTicketSuspenso: vi.fn(),
  avisarTicketRetomado: vi.fn(),
}));

const prisma = (await import("../config/prisma.js")).default;
const eventos = await import("../utils/eventosTicket.js");
const { suspender, retomar } = await import("./tickets.controller.js");

const TECNICO = { id: 20, nome: "Téc", papel: "TECNICO" };
const TICKET = { id: 7, titulo: "VPN", status: "EM_ANDAMENTO", solicitanteId: 10, tecnicoId: 20 };

function mockRes() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn(), send: vi.fn() };
}

function throwingNext(err) {
  if (err) throw err;
}

function req(body = {}) {
  return { params: { id: "7" }, body, user: TECNICO };
}

beforeEach(() => {
  vi.clearAllMocks();
  // $transaction recebe as operações já montadas; devolve o resultado de cada uma.
  prisma.$transaction.mockImplementation((ops) => Promise.all(ops));
  prisma.ticket.update.mockImplementation(({ data }) => Promise.resolve({ ...TICKET, ...data }));
  prisma.comentario.create.mockResolvedValue({ id: 1 });
});

describe("tickets.controller: suspender", () => {
  it("muda para SUSPENSO e registra o motivo como comentário, na mesma transação", async () => {
    prisma.ticket.findUnique.mockResolvedValue(TICKET);
    const res = mockRes();

    await suspender(req({ motivo: "aguardando peça" }), res, throwingNext);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.ticket.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 7 }, data: { status: "SUSPENSO" } }));
    expect(prisma.comentario.create).toHaveBeenCalledWith({
      data: { ticketId: 7, usuarioId: 20, mensagem: "Chamado suspenso. Motivo: aguardando peça" },
    });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 7, status: "SUSPENSO" }));
  });

  it("avisa o solicitante com o motivo", async () => {
    prisma.ticket.findUnique.mockResolvedValue(TICKET);

    await suspender(req({ motivo: "aguardando peça" }), mockRes(), throwingNext);

    expect(eventos.avisarTicketSuspenso).toHaveBeenCalledWith(
      expect.objectContaining({ id: 7, status: "SUSPENSO" }),
      TECNICO,
      "aguardando peça"
    );
  });

  it("recusa chamado fechado ou já suspenso sem mexer em nada", async () => {
    for (const status of ["FECHADO", "SUSPENSO"]) {
      prisma.ticket.findUnique.mockResolvedValue({ ...TICKET, status });
      const res = mockRes();

      await suspender(req({ motivo: "x" }), res, throwingNext);

      expect(res.status).toHaveBeenCalledWith(409);
    }
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.comentario.create).not.toHaveBeenCalled();
    expect(eventos.avisarTicketSuspenso).not.toHaveBeenCalled();
  });

  it("404 quando o chamado não existe", async () => {
    prisma.ticket.findUnique.mockResolvedValue(null);
    const res = mockRes();

    await suspender(req({ motivo: "x" }), res, throwingNext);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe("tickets.controller: retomar", () => {
  it("volta o chamado suspenso para EM_ANDAMENTO e avisa o solicitante", async () => {
    prisma.ticket.findUnique.mockResolvedValue({ ...TICKET, status: "SUSPENSO" });
    const res = mockRes();

    await retomar(req(), res, throwingNext);

    expect(prisma.ticket.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 7 }, data: { status: "EM_ANDAMENTO" } }));
    expect(eventos.avisarTicketRetomado).toHaveBeenCalledWith(expect.objectContaining({ id: 7, status: "EM_ANDAMENTO" }), TECNICO);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: "EM_ANDAMENTO" }));
  });

  it("recusa retomar chamado que não está suspenso", async () => {
    prisma.ticket.findUnique.mockResolvedValue(TICKET);
    const res = mockRes();

    await retomar(req(), res, throwingNext);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(prisma.ticket.update).not.toHaveBeenCalled();
    expect(eventos.avisarTicketRetomado).not.toHaveBeenCalled();
  });
});
