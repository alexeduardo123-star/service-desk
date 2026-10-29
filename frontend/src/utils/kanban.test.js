import { describe, expect, it } from "vitest";
import { agruparPorStatus, filtrarTickets, moverTicket, slaVencido } from "./kanban";

const AGORA = new Date("2026-10-27T12:00:00Z");
const h = (horas) => new Date(AGORA.getTime() - horas * 3600 * 1000).toISOString();

const TICKETS = [
  { id: 1, titulo: "Monitor sem imagem", status: "ABERTO", createdAt: h(10), prioridade: { id: 3, slaHoras: 8 }, categoria: { id: 1 }, tecnico: null },
  { id: 2, titulo: "VPN não conecta", status: "EM_ANDAMENTO", createdAt: h(2), prioridade: { id: 2, slaHoras: 24 }, categoria: { id: 3 }, tecnico: { id: 5 } },
  { id: 3, titulo: "Impressora", status: "FECHADO", createdAt: h(100), closedAt: h(90), prioridade: { id: 3, slaHoras: 8 }, categoria: { id: 1 }, tecnico: { id: 5 } },
];

describe("agruparPorStatus", () => {
  it("separa os chamados nas três colunas", () => {
    const g = agruparPorStatus(TICKETS);
    expect(g.ABERTO.map((t) => t.id)).toEqual([1]);
    expect(g.EM_ANDAMENTO.map((t) => t.id)).toEqual([2]);
    expect(g.FECHADO.map((t) => t.id)).toEqual([3]);
  });

  it("mantém colunas vazias e ignora status desconhecido", () => {
    const g = agruparPorStatus([{ id: 9, status: "CANCELADO" }]);
    expect(g).toEqual({ ABERTO: [], EM_ANDAMENTO: [], FECHADO: [] });
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
    expect(filtrarTickets(TICKETS, { prioridadeId: "3" }, AGORA).map((t) => t.id)).toEqual([1, 3]);
    expect(filtrarTickets(TICKETS, { categoriaId: "3" }, AGORA).map((t) => t.id)).toEqual([2]);
  });

  it("filtra meus chamados e atrasados", () => {
    expect(filtrarTickets(TICKETS, { apenasMeus: true, usuarioId: 5 }, AGORA).map((t) => t.id)).toEqual([2, 3]);
    expect(filtrarTickets(TICKETS, { apenasAtrasados: true }, AGORA).map((t) => t.id)).toEqual([1]);
  });

  it("sem filtros devolve tudo", () => {
    expect(filtrarTickets(TICKETS, {}, AGORA)).toHaveLength(3);
  });
});
