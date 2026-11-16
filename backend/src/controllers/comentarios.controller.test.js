import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../config/prisma.js", () => ({
  default: {
    ticket: { findUnique: vi.fn(), update: vi.fn() },
    comentario: { create: vi.fn() },
  },
}));

vi.mock("../utils/eventosTicket.js", async (original) => ({
  // Mantém as regras puras de verdade (deveRetomarAtendimento) e só espiona os
  // avisos, que fazem acesso ao banco.
  ...(await original()),
  avisarComentario: vi.fn(),
  avisarRetomadaDeAtendimento: vi.fn(),
}));

const prisma = (await import("../config/prisma.js")).default;
const eventos = await import("../utils/eventosTicket.js");
const { criar } = await import("./comentarios.controller.js");

const SOLICITANTE = { id: 10, nome: "Ana", papel: "SOLICITANTE" };
const TECNICO = { id: 20, nome: "Téc", papel: "TECNICO" };
const TICKET_EM_ESPERA = { id: 7, titulo: "VPN", status: "AGUARDANDO_USUARIO", solicitanteId: 10, tecnicoId: 20 };

function mockRes() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn(), send: vi.fn() };
}

function throwingNext(err) {
  if (err) throw err;
}

function req(user, ticketId = "7") {
  return { params: { ticketId }, body: { mensagem: "respondendo" }, user };
}

beforeEach(() => {
  vi.clearAllMocks();
  prisma.comentario.create.mockResolvedValue({ id: 1, mensagem: "respondendo" });
});

describe("comentarios.controller: retomada do atendimento", () => {
  it("solicitante comenta em chamado aguardando resposta: volta para EM_ANDAMENTO", async () => {
    prisma.ticket.findUnique.mockResolvedValue(TICKET_EM_ESPERA);
    prisma.ticket.update.mockResolvedValue({ ...TICKET_EM_ESPERA, status: "EM_ANDAMENTO" });

    await criar(req(SOLICITANTE), mockRes(), throwingNext);

    expect(prisma.ticket.update).toHaveBeenCalledWith({ where: { id: 7 }, data: { status: "EM_ANDAMENTO" } });
  });

  it("notifica o técnico com o chamado já no novo status", async () => {
    prisma.ticket.findUnique.mockResolvedValue(TICKET_EM_ESPERA);
    prisma.ticket.update.mockResolvedValue({ ...TICKET_EM_ESPERA, status: "EM_ANDAMENTO" });

    await criar(req(SOLICITANTE), mockRes(), throwingNext);

    expect(eventos.avisarRetomadaDeAtendimento).toHaveBeenCalledWith(
      expect.objectContaining({ id: 7, status: "EM_ANDAMENTO" }),
      SOLICITANTE
    );
  });

  it("comentário do técnico mantém o chamado aguardando o usuário", async () => {
    prisma.ticket.findUnique.mockResolvedValue(TICKET_EM_ESPERA);

    await criar(req(TECNICO), mockRes(), throwingNext);

    expect(prisma.ticket.update).not.toHaveBeenCalled();
    expect(eventos.avisarRetomadaDeAtendimento).not.toHaveBeenCalled();
  });

  it("não mexe no status quando o chamado não está em espera", async () => {
    prisma.ticket.findUnique.mockResolvedValue({ ...TICKET_EM_ESPERA, status: "EM_ANDAMENTO" });

    await criar(req(SOLICITANTE), mockRes(), throwingNext);

    expect(prisma.ticket.update).not.toHaveBeenCalled();
  });

  it("o comentário continua sendo criado e notificado normalmente", async () => {
    prisma.ticket.findUnique.mockResolvedValue(TICKET_EM_ESPERA);
    prisma.ticket.update.mockResolvedValue({ ...TICKET_EM_ESPERA, status: "EM_ANDAMENTO" });

    const res = mockRes();
    await criar(req(SOLICITANTE), res, throwingNext);

    expect(prisma.comentario.create).toHaveBeenCalled();
    expect(eventos.avisarComentario).toHaveBeenCalledWith(TICKET_EM_ESPERA, SOLICITANTE);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 1, mensagem: "respondendo" });
  });

  it("solicitante não comenta em chamado de outra pessoa", async () => {
    prisma.ticket.findUnique.mockResolvedValue({ ...TICKET_EM_ESPERA, solicitanteId: 99 });

    const res = mockRes();
    await criar(req(SOLICITANTE), res, throwingNext);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(prisma.ticket.update).not.toHaveBeenCalled();
  });
});
