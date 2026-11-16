import { describe, it, expect, vi } from "vitest";
import {
  destinatariosDoComentario,
  avisarStatusAlterado,
  avisarTicketCriado,
  avisarRetomadaDeAtendimento,
  deveRetomarAtendimento,
} from "./eventosTicket.js";

const TICKET = { id: 7, titulo: "Notebook não liga", solicitanteId: 10, tecnicoId: 20, status: "FECHADO" };

function depsFalsas({ usuarios = {}, equipe = [] } = {}) {
  return {
    prisma: {
      usuario: {
        findUnique: vi.fn(({ where }) => Promise.resolve(usuarios[where.id] ?? null)),
        findMany: vi.fn().mockResolvedValue(equipe),
      },
      configuracaoUsuario: { findMany: vi.fn().mockResolvedValue([]) },
      notificacao: { createMany: vi.fn().mockResolvedValue({ count: 1 }) },
    },
    enviarEmail: vi.fn().mockResolvedValue(undefined),
  };
}

describe("destinatariosDoComentario", () => {
  it("solicitante comenta: avisa o técnico responsável", () => {
    const r = destinatariosDoComentario(TICKET, { id: 10, papel: "SOLICITANTE" });
    expect(r).toEqual({ ids: [20], incluirEquipe: false });
  });

  it("solicitante comenta em chamado sem técnico: avisa a equipe", () => {
    const r = destinatariosDoComentario({ ...TICKET, tecnicoId: null }, { id: 10, papel: "SOLICITANTE" });
    expect(r).toEqual({ ids: [], incluirEquipe: true });
  });

  it("técnico comenta: avisa o solicitante e não a si mesmo", () => {
    const r = destinatariosDoComentario(TICKET, { id: 20, papel: "TECNICO" });
    expect(r).toEqual({ ids: [10], incluirEquipe: false });
  });

  it("admin comenta: avisa solicitante e técnico", () => {
    const r = destinatariosDoComentario(TICKET, { id: 1, papel: "ADMIN" });
    expect(r.ids.sort()).toEqual([10, 20]);
  });
});

describe("avisarStatusAlterado", () => {
  it("notifica o solicitante com o status em português", async () => {
    const deps = depsFalsas({ usuarios: { 10: { id: 10, nome: "Ana", email: "a@a.com", ativo: true } } });
    await avisarStatusAlterado(TICKET, { id: 20, nome: "Téc" }, deps);
    const data = deps.prisma.notificacao.createMany.mock.calls[0][0].data[0];
    expect(data.usuarioId).toBe(10);
    expect(data.tipo).toBe("TICKET_STATUS");
    expect(data.titulo).toContain("Fechado");
  });

  it("não notifica quando o próprio solicitante é quem alterou", async () => {
    const deps = depsFalsas({ usuarios: { 10: { id: 10, nome: "Ana", ativo: true } } });
    await avisarStatusAlterado(TICKET, { id: 10, nome: "Ana" }, deps);
    expect(deps.prisma.notificacao.createMany).not.toHaveBeenCalled();
  });
});

describe("avisarTicketCriado", () => {
  it("avisa a equipe, menos quem abriu o chamado", async () => {
    const deps = depsFalsas({ equipe: [{ id: 1, ativo: true }, { id: 2, ativo: true }] });
    await avisarTicketCriado({ id: 7, titulo: "X" }, { id: 1, nome: "Admin" }, deps);
    const data = deps.prisma.notificacao.createMany.mock.calls[0][0].data;
    expect(data.map((n) => n.usuarioId)).toEqual([2]);
  });

  it("nunca lança, mesmo se o banco falhar", async () => {
    const deps = depsFalsas();
    deps.prisma.usuario.findMany = vi.fn(() => Promise.reject(new Error("falhou")));
    const spy = console.error;
    console.error = () => {};
    await avisarTicketCriado({ id: 7, titulo: "X" }, { id: 1, nome: "Admin" }, deps);
    console.error = spy;
    expect(true).toBe(true);
  });
});

const AGUARDANDO = { ...TICKET, status: "AGUARDANDO_USUARIO" };

describe("deveRetomarAtendimento", () => {
  it("solicitante responde no chamado em espera: retoma", () => {
    expect(deveRetomarAtendimento(AGUARDANDO, { id: 10, papel: "SOLICITANTE" })).toBe(true);
  });

  it("comentário do técnico ou do admin não tira o chamado da espera", () => {
    expect(deveRetomarAtendimento(AGUARDANDO, { id: 20, papel: "TECNICO" })).toBe(false);
    expect(deveRetomarAtendimento(AGUARDANDO, { id: 1, papel: "ADMIN" })).toBe(false);
  });

  it("não retoma chamado que não está aguardando o usuário", () => {
    for (const status of ["ABERTO", "EM_ANDAMENTO", "FECHADO"]) {
      expect(deveRetomarAtendimento({ ...TICKET, status }, { id: 10, papel: "SOLICITANTE" })).toBe(false);
    }
  });
});

describe("avisarRetomadaDeAtendimento", () => {
  it("avisa o técnico responsável que o usuário respondeu", async () => {
    const deps = depsFalsas({ usuarios: { 20: { id: 20, nome: "Téc", email: "t@t.com", ativo: true } } });

    await avisarRetomadaDeAtendimento({ ...AGUARDANDO, status: "EM_ANDAMENTO" }, { id: 10, nome: "Ana" }, deps);

    const data = deps.prisma.notificacao.createMany.mock.calls[0][0].data[0];
    expect(data.usuarioId).toBe(20);
    expect(data.tipo).toBe("TICKET_STATUS");
    expect(data.titulo).toContain("Em andamento");
    expect(data.mensagem).toContain("Ana");
    expect(data.ticketId).toBe(7);
  });

  it("sem técnico responsável, avisa a equipe", async () => {
    const deps = depsFalsas({ equipe: [{ id: 1, ativo: true }, { id: 2, ativo: true }] });

    await avisarRetomadaDeAtendimento({ ...AGUARDANDO, tecnicoId: null }, { id: 10, nome: "Ana" }, deps);

    const data = deps.prisma.notificacao.createMany.mock.calls[0][0].data;
    expect(data.map((n) => n.usuarioId)).toEqual([1, 2]);
  });

  it("nunca lança, mesmo se o banco falhar", async () => {
    const deps = depsFalsas();
    deps.prisma.usuario.findUnique = vi.fn(() => Promise.reject(new Error("falhou")));
    const spy = console.error;
    console.error = () => {};
    await avisarRetomadaDeAtendimento(AGUARDANDO, { id: 10, nome: "Ana" }, deps);
    console.error = spy;
    expect(deps.prisma.notificacao.createMany).not.toHaveBeenCalled();
  });
});
