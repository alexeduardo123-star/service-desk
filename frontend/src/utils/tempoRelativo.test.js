import { describe, expect, it } from "vitest";
import { tempoRelativo } from "./tempoRelativo";

const AGORA = new Date("2026-10-27T12:00:00Z");
const atras = (ms) => new Date(AGORA.getTime() - ms).toISOString();
const MIN = 60 * 1000;
const H = 60 * MIN;
const D = 24 * H;

describe("tempoRelativo", () => {
  it("retorna '-' sem data ou com data inválida", () => {
    expect(tempoRelativo(null, AGORA)).toBe("-");
    expect(tempoRelativo("lixo", AGORA)).toBe("-");
  });

  it("usa 'agora mesmo' para menos de um minuto", () => {
    expect(tempoRelativo(atras(20 * 1000), AGORA)).toBe("agora mesmo");
  });

  it("mostra minutos e horas", () => {
    expect(tempoRelativo(atras(5 * MIN), AGORA)).toBe("há 5 min");
    expect(tempoRelativo(atras(3 * H), AGORA)).toBe("há 3 h");
  });

  it("mostra ontem e dias", () => {
    expect(tempoRelativo(atras(30 * H), AGORA)).toBe("ontem");
    expect(tempoRelativo(atras(4 * D), AGORA)).toBe("há 4 dias");
  });

  it("cai para a data completa depois de uma semana", () => {
    expect(tempoRelativo(atras(10 * D), AGORA)).toMatch(/^\d{2}\/\d{2}\/\d{4}/);
  });
});
