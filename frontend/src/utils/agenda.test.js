import { describe, it, expect } from "vitest";
import {
  chaveDoDia,
  horaDoDia,
  instanteDeLocal,
  localDeInstante,
  somarMeses,
  diasDoMes,
  periodoDaGrade,
  agruparPorDia,
  tituloDoDia,
  podeAlterarAgendamento,
} from "./agenda";

const SP = "America/Sao_Paulo";

describe("fuso horário", () => {
  it("converte entre instante e horário local no fuso", () => {
    expect(instanteDeLocal("2026-11-02T10:00", SP)).toBe("2026-11-02T13:00:00.000Z");
    expect(localDeInstante("2026-11-02T13:00:00.000Z", SP)).toBe("2026-11-02T10:00");
  });

  it("ida e volta é neutra, inclusive perto da meia-noite", () => {
    for (const texto of ["2026-11-02T00:30", "2026-12-31T23:59", "2026-01-01T00:00"]) {
      expect(localDeInstante(instanteDeLocal(texto, SP), SP)).toBe(texto);
    }
  });

  it("texto inválido devolve vazio", () => {
    expect(instanteDeLocal("", SP)).toBe("");
    expect(instanteDeLocal("02/11/2026 10:00", SP)).toBe("");
    expect(localDeInstante("", SP)).toBe("");
  });

  it("o dia depende do fuso: 02:00Z ainda é o dia anterior em São Paulo", () => {
    expect(chaveDoDia("2026-11-03T02:00:00Z", SP)).toBe("2026-11-02");
    expect(chaveDoDia("2026-11-03T02:00:00Z", "UTC")).toBe("2026-11-03");
    expect(horaDoDia("2026-11-03T02:30:00Z", SP)).toBe("23:30");
  });
});

describe("somarMeses", () => {
  it("vira o ano nos dois sentidos", () => {
    expect(somarMeses({ ano: 2026, mes: 12 }, 1)).toEqual({ ano: 2027, mes: 1 });
    expect(somarMeses({ ano: 2026, mes: 1 }, -1)).toEqual({ ano: 2025, mes: 12 });
    expect(somarMeses({ ano: 2026, mes: 5 }, 0)).toEqual({ ano: 2026, mes: 5 });
    expect(somarMeses({ ano: 2026, mes: 1 }, -13)).toEqual({ ano: 2024, mes: 12 });
  });
});

describe("diasDoMes", () => {
  it("monta semanas completas começando no domingo", () => {
    const dias = diasDoMes({ ano: 2026, mes: 11 }); // 1º/nov/2026 é domingo; 30/nov é segunda

    expect(dias[0]).toEqual({ chave: "2026-11-01", dia: 1, doMes: true });
    expect(dias.length % 7).toBe(0);
    expect(dias.at(-1).chave).toBe("2026-12-05");
    expect(dias.at(-1).doMes).toBe(false);
    expect(dias.filter((d) => d.doMes)).toHaveLength(30);
  });

  it("inclui dias do mês anterior quando o mês não começa no domingo", () => {
    const dias = diasDoMes({ ano: 2026, mes: 12 }); // 1º/dez/2026 é terça

    expect(dias[0].chave).toBe("2026-11-29");
    expect(dias[0].doMes).toBe(false);
    expect(dias[2]).toEqual({ chave: "2026-12-01", dia: 1, doMes: true });
  });

  it("nunca passa de 6 semanas", () => {
    for (let mes = 1; mes <= 12; mes += 1) {
      expect(diasDoMes({ ano: 2026, mes }).length).toBeLessThanOrEqual(42);
    }
  });
});

describe("periodoDaGrade", () => {
  it("cobre a grade com folga de um dia e cabe no limite de 62 dias da API", () => {
    const dias = diasDoMes({ ano: 2026, mes: 11 });
    const { inicio, fim } = periodoDaGrade(dias);

    expect(inicio).toBe("2026-10-31T00:00:00.000Z");
    expect(fim).toBe("2026-12-07T00:00:00.000Z");
    expect((new Date(fim) - new Date(inicio)) / 86_400_000).toBeLessThanOrEqual(62);
  });
});

describe("agruparPorDia", () => {
  it("coloca prazos e atendimentos no dia certo do fuso", () => {
    const mapa = agruparPorDia(
      [{ ticketId: 1, prazo: "2026-11-03T02:00:00Z" }],
      [{ id: 9, inicio: "2026-11-02T13:00:00Z" }, { id: 10, inicio: "2026-11-02T15:00:00Z" }],
      SP
    );

    expect(mapa["2026-11-02"].prazos).toHaveLength(1);
    expect(mapa["2026-11-02"].agendamentos.map((a) => a.id)).toEqual([9, 10]);
    expect(mapa["2026-11-03"]).toBeUndefined();
  });

  it("sem dados devolve objeto vazio", () => {
    expect(agruparPorDia()).toEqual({});
  });
});

describe("tituloDoDia", () => {
  it("escreve o dia da semana e o mês por extenso", () => {
    expect(tituloDoDia("2026-11-02")).toBe("segunda-feira, 2 de novembro");
    expect(tituloDoDia("2026-12-25")).toBe("sexta-feira, 25 de dezembro");
  });
});

describe("podeAlterarAgendamento", () => {
  const meu = { atendente: { id: 3 } };
  const deOutro = { atendente: { id: 4 } };

  it("precisa de gerenciar; sem 'todos', só os próprios", () => {
    expect(podeAlterarAgendamento({ id: 3 }, meu, { gerenciar: true, todos: false })).toBe(true);
    expect(podeAlterarAgendamento({ id: 3 }, deOutro, { gerenciar: true, todos: false })).toBe(false);
    expect(podeAlterarAgendamento({ id: 3 }, deOutro, { gerenciar: true, todos: true })).toBe(true);
    expect(podeAlterarAgendamento({ id: 3 }, meu, { gerenciar: false, todos: true })).toBe(false);
  });
});
