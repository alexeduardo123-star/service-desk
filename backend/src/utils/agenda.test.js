import { describe, it, expect } from "vitest";
import { prazoSla, prazosNoPeriodo, sobrepoe, podeGerenciarAgendamento } from "./agenda";

const aberto = (extra = {}) => ({
  id: 1,
  titulo: "VPN",
  status: "ABERTO",
  createdAt: "2026-11-02T10:00:00.000Z",
  prioridade: { id: 2, nome: "Alta", slaHoras: 8 },
  tecnico: { id: 9, nome: "Téc" },
  ...extra,
});

describe("prazoSla", () => {
  it("é a abertura mais as horas de SLA da prioridade", () => {
    expect(prazoSla(aberto()).toISOString()).toBe("2026-11-02T18:00:00.000Z");
  });

  it("fechado, suspenso, rejeitado ou sem SLA não tem prazo", () => {
    expect(prazoSla(aberto({ status: "FECHADO" }))).toBeNull();
    expect(prazoSla(aberto({ status: "SUSPENSO" }))).toBeNull();
    expect(prazoSla(aberto({ aprovacaoStatus: "REJEITADA" }))).toBeNull();
    expect(prazoSla(aberto({ prioridade: { slaHoras: 0 } }))).toBeNull();
    expect(prazoSla(aberto({ prioridade: null }))).toBeNull();
  });

  it("aguardando resposta do usuário continua contando", () => {
    expect(prazoSla(aberto({ status: "AGUARDANDO_USUARIO" }))).not.toBeNull();
  });
});

describe("prazosNoPeriodo", () => {
  const inicio = new Date("2026-11-02T00:00:00Z");
  const fim = new Date("2026-11-03T00:00:00Z");
  const agora = new Date("2026-11-02T12:00:00Z");

  it("só traz os prazos dentro do período, em ordem, marcando vencidos", () => {
    const lista = prazosNoPeriodo(
      [
        aberto({ id: 1, createdAt: "2026-11-02T10:00:00Z" }), // 18:00 (futuro)
        aberto({ id: 2, createdAt: "2026-11-02T00:00:00Z" }), // 08:00 (vencido)
        aberto({ id: 3, createdAt: "2026-10-01T00:00:00Z" }), // fora
        aberto({ id: 4, status: "FECHADO" }), // sem prazo
      ],
      inicio,
      fim,
      agora
    );

    expect(lista.map((p) => p.ticketId)).toEqual([2, 1]);
    expect(lista.map((p) => p.vencido)).toEqual([true, false]);
    expect(lista[0]).toMatchObject({ titulo: "VPN", prioridade: { id: 2, nome: "Alta" }, tecnico: { id: 9, nome: "Téc" } });
  });

  it("o fim do período é exclusivo e o início é inclusivo", () => {
    const naBorda = aberto({ createdAt: "2026-11-02T16:00:00Z" }); // prazo 00:00 do dia 3
    expect(prazosNoPeriodo([naBorda], inicio, fim, agora)).toHaveLength(0);
    expect(prazosNoPeriodo([naBorda], fim, new Date("2026-11-04T00:00:00Z"), agora)).toHaveLength(1);
  });
});

describe("sobrepoe", () => {
  const h = (n) => new Date(`2026-11-02T${String(n).padStart(2, "0")}:00:00Z`);

  it("detecta sobreposição, mas horários colados não conflitam", () => {
    expect(sobrepoe({ inicio: h(9), fim: h(11) }, { inicio: h(10), fim: h(12) })).toBe(true);
    expect(sobrepoe({ inicio: h(9), fim: h(12) }, { inicio: h(10), fim: h(11) })).toBe(true);
    expect(sobrepoe({ inicio: h(9), fim: h(10) }, { inicio: h(10), fim: h(11) })).toBe(false);
    expect(sobrepoe({ inicio: h(9), fim: h(10) }, { inicio: h(13), fim: h(14) })).toBe(false);
  });
});

describe("podeGerenciarAgendamento", () => {
  it("o próprio atendente ou quem gerencia a agenda de todos", () => {
    expect(podeGerenciarAgendamento({ usuarioId: 3, atendenteId: 3, temPermissaoTodos: false })).toBe(true);
    expect(podeGerenciarAgendamento({ usuarioId: 3, atendenteId: 4, temPermissaoTodos: false })).toBe(false);
    expect(podeGerenciarAgendamento({ usuarioId: 3, atendenteId: 4, temPermissaoTodos: true })).toBe(true);
  });
});
