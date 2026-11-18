import { describe, expect, it } from "vitest";
import { COLUNAS_KANBAN, acaoAoMover, agruparPorStatus, filtrarTickets, moverTicket, slaVencido } from "./kanban";

const AGORA = new Date("2026-10-27T12:00:00Z");
const h = (horas) => new Date(AGORA.getTime() - horas * 3600 * 1000).toISOString();

const TICKETS = [
  { id: 1, titulo: "Monitor sem imagem", status: "ABERTO", createdAt: h(10), prioridade: { id: 3, slaHoras: 8 }, categoria: { id: 1 }, tecnico: null },
  { id: 2, titulo: "VPN não conecta", status: "EM_ANDAMENTO", createdAt: h(2), prioridade: { id: 2, slaHoras: 24 }, categoria: { id: 3 }, tecnico: { id: 5 } },
  { id: 3, titulo: "Impressora", status: "FECHADO", createdAt: h(100), closedAt: h(90), prioridade: { id: 3, slaHoras: 8 }, categoria: { id: 1 }, tecnico: { id: 5 } },
  { id: 4, titulo: "Aguardando print", status: "AGUARDANDO_USUARIO", createdAt: h(5), prioridade: { id: 2, slaHoras: 24 }, categoria: { id: 3 }, tecnico: { id: 5 } },
  { id: 5, titulo: "Troca de HD", status: "SUSPENSO", createdAt: h(50), prioridade: { id: 3, slaHoras: 8 }, categoria: { id: 1 }, tecnico: { id: 5 } },
];

describe("COLUNAS_KANBAN", () => {
  it("vai do aberto ao fechado, com a espera do usuário e o suspenso antes do fim", () => {
    expect(COLUNAS_KANBAN).toEqual(["ABERTO", "EM_ANDAMENTO", "AGUARDANDO_USUARIO", "SUSPENSO", "FECHADO"]);
  });
});

describe("agruparPorStatus", () => {
  it("separa os chamados nas cinco colunas", () => {
    const g = agruparPorStatus(TICKETS);
    expect(g.ABERTO.map((t) => t.id)).toEqual([1]);
    expect(g.EM_ANDAMENTO.map((t) => t.id)).toEqual([2]);
    expect(g.AGUARDANDO_USUARIO.map((t) => t.id)).toEqual([4]);
    expect(g.SUSPENSO.map((t) => t.id)).toEqual([5]);
    expect(g.FECHADO.map((t) => t.id)).toEqual([3]);
  });

  it("mantém colunas vazias e ignora status desconhecido", () => {
    const g = agruparPorStatus([{ id: 9, status: "CANCELADO" }]);
    expect(g).toEqual({ ABERTO: [], EM_ANDAMENTO: [], AGUARDANDO_USUARIO: [], SUSPENSO: [], FECHADO: [] });
  });
});

describe("slaVencido", () => {
  it("detecta chamado aberto fora do prazo", () => {
    expect(slaVencido(TICKETS[0], AGORA)).toBe(true);
    expect(slaVencido(TICKETS[1], AGORA)).toBe(false);
  });

  it("chamado fechado nunca está atrasado", () => {
    expect(slaVencido(TICKETS[2], AGORA)).toBe(false);
  });

  it("chamado aguardando o usuário continua valendo SLA", () => {
    expect(slaVencido(TICKETS[3], AGORA)).toBe(false);
    expect(slaVencido({ ...TICKETS[3], createdAt: h(30) }, AGORA)).toBe(true);
  });

  it("chamado suspenso não aparece como atrasado enquanto suspenso", () => {
    // Criado há 50h com SLA de 8h: só não está vencido por estar suspenso.
    expect(slaVencido(TICKETS[4], AGORA)).toBe(false);
    expect(slaVencido({ ...TICKETS[4], status: "EM_ANDAMENTO" }, AGORA)).toBe(true);
  });
});

describe("moverTicket", () => {
  it("troca o status sem mutar a lista original", () => {
    const nova = moverTicket(TICKETS, 1, "EM_ANDAMENTO", AGORA);
    expect(nova[0].status).toBe("EM_ANDAMENTO");
    expect(TICKETS[0].status).toBe("ABERTO");
  });

  it("preenche closedAt ao fechar e limpa ao reabrir", () => {
    expect(moverTicket(TICKETS, 1, "FECHADO", AGORA)[0].closedAt).toBe(AGORA.toISOString());
    expect(moverTicket(TICKETS, 3, "ABERTO", AGORA)[2].closedAt).toBeNull();
  });
});

describe("filtrarTickets", () => {
  it("filtra por texto, inclusive pelo número do chamado", () => {
    expect(filtrarTickets(TICKETS, { busca: "vpn" }, AGORA).map((t) => t.id)).toEqual([2]);
    expect(filtrarTickets(TICKETS, { busca: "#3" }, AGORA).map((t) => t.id)).toEqual([3]);
  });

  it("filtra por prioridade e categoria", () => {
    expect(filtrarTickets(TICKETS, { prioridadeId: "3" }, AGORA).map((t) => t.id)).toEqual([1, 3, 5]);
    expect(filtrarTickets(TICKETS, { categoriaId: "3" }, AGORA).map((t) => t.id)).toEqual([2, 4]);
  });

  it("filtra meus chamados e atrasados", () => {
    expect(filtrarTickets(TICKETS, { apenasMeus: true, usuarioId: 5 }, AGORA).map((t) => t.id)).toEqual([2, 3, 4, 5]);
    expect(filtrarTickets(TICKETS, { apenasAtrasados: true }, AGORA).map((t) => t.id)).toEqual([1]);
  });

  it("sem filtros devolve tudo", () => {
    expect(filtrarTickets(TICKETS, {}, AGORA)).toHaveLength(5);
  });
});

describe("acaoAoMover", () => {
  const TECNICO = { id: 5, papel: "TECNICO" };
  const ADMIN = { id: 1, papel: "ADMIN" };

  it("soltar na coluna Suspenso pede o motivo em vez de mudar o status", () => {
    expect(acaoAoMover(TICKETS[1], "SUSPENSO", TECNICO)).toBe("exigeMotivo");
    expect(acaoAoMover(TICKETS[0], "SUSPENSO", ADMIN)).toBe("exigeMotivo");
  });

  it("suspenso para Em andamento é retomar, mesmo sem técnico", () => {
    expect(acaoAoMover(TICKETS[4], "EM_ANDAMENTO", ADMIN)).toBe("retomar");
    expect(acaoAoMover({ ...TICKETS[4], tecnico: null }, "EM_ANDAMENTO", TECNICO)).toBe("retomar");
  });

  it("técnico que puxa chamado sem responsável para Em andamento assume", () => {
    expect(acaoAoMover(TICKETS[0], "EM_ANDAMENTO", TECNICO)).toBe("assumir");
    expect(acaoAoMover(TICKETS[0], "EM_ANDAMENTO", ADMIN)).toBe("status");
  });

  it("demais movimentos são troca de status comum", () => {
    expect(acaoAoMover(TICKETS[4], "FECHADO", TECNICO)).toBe("status");
    expect(acaoAoMover(TICKETS[1], "AGUARDANDO_USUARIO", TECNICO)).toBe("status");
  });
});
