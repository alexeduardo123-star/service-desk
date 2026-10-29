import { describe, it, expect } from "vitest";
import { montarLinhas } from "./relatorio.js";

const AGORA = new Date("2026-10-27T12:00:00Z");
const h = (horas) => new Date(AGORA.getTime() - horas * 3600 * 1000).toISOString();
const ALTA = { nome: "Alta", nivel: 3, slaHoras: 8 };

const base = { titulo: "T", categoria: { nome: "Rede" }, prioridade: ALTA, solicitante: { nome: "Ana" }, tecnico: { nome: "Téc" } };

describe("montarLinhas", () => {
  it("achata as relações em campos simples", () => {
    const [linha] = montarLinhas([{ ...base, id: 1, status: "ABERTO", createdAt: h(1), closedAt: null }], AGORA);
    expect(linha).toMatchObject({ id: 1, categoria: "Rede", prioridade: "Alta", solicitante: "Ana", tecnico: "Téc", fechadoEm: null, horasResolucao: null });
  });

  it("marca chamado aberto fora do prazo como VENCIDO", () => {
    const [linha] = montarLinhas([{ ...base, id: 1, status: "ABERTO", createdAt: h(20), closedAt: null }], AGORA);
    expect(linha.slaStatus).toBe("VENCIDO");
  });

  it("marca chamado aberto dentro do prazo como NO_PRAZO", () => {
    const [linha] = montarLinhas([{ ...base, id: 1, status: "EM_ANDAMENTO", createdAt: h(2), closedAt: null }], AGORA);
    expect(linha.slaStatus).toBe("NO_PRAZO");
  });

  it("calcula horas de resolução e se fechou no prazo", () => {
    const noPrazo = montarLinhas([{ ...base, id: 1, status: "FECHADO", createdAt: h(10), closedAt: h(5) }], AGORA)[0];
    const atrasado = montarLinhas([{ ...base, id: 2, status: "FECHADO", createdAt: h(30), closedAt: h(5) }], AGORA)[0];
    expect(noPrazo.horasResolucao).toBe(5);
    expect(noPrazo.slaStatus).toBe("NO_PRAZO");
    expect(atrasado.horasResolucao).toBe(25);
    expect(atrasado.slaStatus).toBe("ATRASADO");
  });

  it("tolera relações ausentes", () => {
    const [linha] = montarLinhas([{ id: 3, titulo: "X", status: "ABERTO", createdAt: h(1), closedAt: null }], AGORA);
    expect(linha.categoria).toBeNull();
    expect(linha.tecnico).toBeNull();
  });
});
