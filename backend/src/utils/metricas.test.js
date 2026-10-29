import { describe, it, expect } from "vitest";
import { calcularMetricas, slaVencido, fechadoNoPrazo, horasEntre, chaveDia } from "./metricas.js";

const AGORA = new Date("2026-10-27T15:00:00Z");
const h = (horas) => new Date(AGORA.getTime() - horas * 3600 * 1000).toISOString();

const ALTA = { nome: "Alta", nivel: 3, slaHoras: 8 };
const BAIXA = { nome: "Baixa", nivel: 1, slaHoras: 72 };
const HW = { nome: "Hardware" };
const SW = { nome: "Software" };

function ticket(extra) {
  return { id: 1, status: "ABERTO", createdAt: h(1), closedAt: null, tecnicoId: null, tecnico: null, categoria: HW, prioridade: BAIXA, ...extra };
}

describe("horasEntre / chaveDia", () => {
  it("calcula a diferença em horas", () => {
    expect(horasEntre("2026-10-27T10:00:00Z", "2026-10-27T13:30:00Z")).toBe(3.5);
  });

  it("agrupa por dia no fuso de Brasília por padrão", () => {
    // 01:00 UTC ainda é o dia anterior em UTC-3
    expect(chaveDia("2026-10-27T01:00:00Z")).toBe("2026-10-26");
    expect(chaveDia("2026-10-27T01:00:00Z", 0)).toBe("2026-10-27");
  });
});

describe("slaVencido / fechadoNoPrazo", () => {
  it("marca como vencido o chamado aberto além do SLA", () => {
    expect(slaVencido(ticket({ prioridade: ALTA, createdAt: h(9) }), AGORA)).toBe(true);
    expect(slaVencido(ticket({ prioridade: ALTA, createdAt: h(7) }), AGORA)).toBe(false);
  });

  it("chamado fechado nunca é considerado vencido", () => {
    expect(slaVencido(ticket({ status: "FECHADO", prioridade: ALTA, createdAt: h(50) }), AGORA)).toBe(false);
  });

  it("avalia se o fechamento respeitou o SLA", () => {
    expect(fechadoNoPrazo(ticket({ status: "FECHADO", prioridade: ALTA, createdAt: h(10), closedAt: h(5) }))).toBe(true);
    expect(fechadoNoPrazo(ticket({ status: "FECHADO", prioridade: ALTA, createdAt: h(20), closedAt: h(5) }))).toBe(false);
    expect(fechadoNoPrazo(ticket({ status: "ABERTO" }))).toBeNull();
  });
});

describe("calcularMetricas", () => {
  const tickets = [
    ticket({ id: 1, status: "ABERTO", categoria: HW, prioridade: ALTA, createdAt: h(10) }),
    ticket({ id: 2, status: "EM_ANDAMENTO", categoria: SW, prioridade: BAIXA, tecnicoId: 5, tecnico: { nome: "Téc" }, createdAt: h(2) }),
    ticket({ id: 3, status: "FECHADO", categoria: HW, prioridade: ALTA, tecnicoId: 5, tecnico: { nome: "Téc" }, createdAt: h(30), closedAt: h(26) }),
    ticket({ id: 4, status: "FECHADO", categoria: HW, prioridade: ALTA, tecnicoId: 6, tecnico: { nome: "Outro" }, createdAt: h(40), closedAt: h(20) }),
  ];
  const m = calcularMetricas(tickets, { agora: AGORA });

  it("conta os totais por status, sem técnico e SLA vencido", () => {
    expect(m.totais).toEqual({ total: 4, abertos: 1, emAndamento: 1, fechados: 2, semTecnico: 1, slaVencidos: 1 });
  });

  it("agrupa por categoria em ordem decrescente", () => {
    expect(m.porCategoria).toEqual([{ nome: "Hardware", total: 3 }, { nome: "Software", total: 1 }]);
  });

  it("agrupa por prioridade em ordem de nível", () => {
    expect(m.porPrioridade.map((p) => p.nome)).toEqual(["Baixa", "Alta"]);
    expect(m.porPrioridade[1].total).toBe(3);
  });

  it("gera a série diária completa, sem buracos", () => {
    const m7 = calcularMetricas(tickets, { agora: AGORA, dias: 7 });
    expect(m7.porDia).toHaveLength(7);
    expect(m7.porDia[6].data).toBe("2026-10-27");
    expect(m7.porDia[0].data).toBe("2026-10-21");
    expect(m7.porDia.reduce((s, d) => s + d.abertos, 0)).toBe(4);
  });

  it("calcula tempo médio de resolução e % de SLA cumprido", () => {
    // chamado 3: 4h (no prazo de 8h) | chamado 4: 20h (estourou)
    expect(m.tempoMedioResolucaoHoras).toBe(12);
    expect(m.slaCumpridoPercentual).toBe(50);
  });

  it("monta o ranking de técnicos", () => {
    expect(m.topTecnicos).toEqual([
      { nome: "Téc", total: 2, fechados: 1 },
      { nome: "Outro", total: 1, fechados: 1 },
    ]);
  });

  it("omite o ranking de técnicos para solicitantes", () => {
    expect(calcularMetricas(tickets, { agora: AGORA, incluirTecnicos: false }).topTecnicos).toBeNull();
  });

  it("devolve zeros e nulls quando não há chamados", () => {
    const vazio = calcularMetricas([], { agora: AGORA });
    expect(vazio.totais.total).toBe(0);
    expect(vazio.tempoMedioResolucaoHoras).toBeNull();
    expect(vazio.slaCumpridoPercentual).toBeNull();
    expect(vazio.porDia).toHaveLength(14);
  });
});
