import { describe, expect, it } from "vitest";
import { diaCurto, escalaMaxima, fatiasDonut, formatarHoras, marcasEixo, pontosLinha, pontosParaPath } from "./charts";

describe("escalaMaxima / marcasEixo", () => {
  it("usa no mínimo 4", () => {
    expect(escalaMaxima([])).toBe(4);
    expect(escalaMaxima([1, 2])).toBe(4);
  });

  it("arredonda para múltiplo de 4", () => {
    expect(escalaMaxima([5])).toBe(8);
    expect(escalaMaxima([9, 3])).toBe(12);
    expect(escalaMaxima([16])).toBe(16);
  });

  it("gera marcas inteiras igualmente espaçadas", () => {
    expect(marcasEixo(8)).toEqual([0, 2, 4, 6, 8]);
  });
});

describe("pontosLinha / pontosParaPath", () => {
  const config = { largura: 100, altura: 100, max: 10, margem: { topo: 0, direita: 0, base: 0, esquerda: 0 } };

  it("posiciona o primeiro e o último ponto nas bordas", () => {
    const pontos = pontosLinha([0, 5, 10], config);
    expect(pontos.map((p) => p.x)).toEqual([0, 50, 100]);
    expect(pontos.map((p) => p.y)).toEqual([100, 50, 0]);
  });

  it("centraliza quando há um único ponto", () => {
    expect(pontosLinha([5], config)[0].x).toBe(50);
  });

  it("monta o path com M e L", () => {
    const path = pontosParaPath([{ x: 0, y: 10 }, { x: 5, y: 2.5 }]);
    expect(path).toBe("M0.0 10.0 L5.0 2.5");
  });
});

describe("fatiasDonut", () => {
  it("calcula percentuais e ignora itens zerados", () => {
    const fatias = fatiasDonut([
      { rotulo: "A", valor: 3 },
      { rotulo: "B", valor: 0 },
      { rotulo: "C", valor: 1 },
    ]);
    expect(fatias.map((f) => f.rotulo)).toEqual(["A", "C"]);
    expect(fatias.map((f) => f.percentual)).toEqual([75, 25]);
  });

  it("encadeia os deslocamentos e fecha o círculo", () => {
    const [a, b] = fatiasDonut([{ valor: 1 }, { valor: 1 }], 10);
    const circunferencia = 2 * Math.PI * 10;
    expect(a.deslocamento).toBe(-0);
    expect(b.deslocamento).toBeCloseTo(-circunferencia / 2, 5);
    expect(a.comprimento + b.comprimento).toBeCloseTo(circunferencia, 5);
  });

  it("devolve lista vazia quando tudo é zero", () => {
    expect(fatiasDonut([{ valor: 0 }])).toEqual([]);
  });
});

describe("diaCurto / formatarHoras", () => {
  it("formata dia/mês", () => {
    expect(diaCurto("2026-10-27")).toBe("27/10");
  });

  it("formata durações", () => {
    expect(formatarHoras(null)).toBe("-");
    expect(formatarHoras(0.5)).toBe("30 min");
    expect(formatarHoras(5.25)).toBe("5,3 h");
    expect(formatarHoras(60)).toBe("2,5 dias");
  });
});
