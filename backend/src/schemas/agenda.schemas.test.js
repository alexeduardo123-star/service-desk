import { describe, it, expect } from "vitest";
import { agendamentoSchema, consultaAgendaSchema } from "./agenda.schemas.js";

const base = { titulo: "Visita ao cliente", inicio: "2026-11-02T10:00:00Z", fim: "2026-11-02T11:00:00Z" };
const mensagem = (schema, dados) => schema.safeParse(dados).error?.issues[0]?.message;

describe("agendamentoSchema", () => {
  it("aceita um agendamento simples e converte datas", () => {
    const r = agendamentoSchema.parse({ ...base, descricao: "  Levar notebook ", ticketId: "7", atendenteId: "3" });

    expect(r.inicio).toBeInstanceOf(Date);
    expect(r.descricao).toBe("Levar notebook");
    expect(r.ticketId).toBe(7);
    expect(r.atendenteId).toBe(3);
  });

  it("chamado e atendente são opcionais", () => {
    const r = agendamentoSchema.parse(base);
    expect(r.ticketId).toBeNull();
    expect(r.atendenteId).toBeUndefined();
    expect(r.descricao).toBeNull();
  });

  it("exige título e datas válidas", () => {
    expect(mensagem(agendamentoSchema, { ...base, titulo: "" })).toBe("Informe o título");
    expect(mensagem(agendamentoSchema, { ...base, inicio: "ontem" })).toBe("Informe o início do atendimento");
    expect(mensagem(agendamentoSchema, { ...base, fim: undefined })).toBe("Informe o fim do atendimento");
  });

  it("o fim tem que ser depois do início e a duração limitada", () => {
    expect(mensagem(agendamentoSchema, { ...base, fim: base.inicio })).toBe("O fim deve ser depois do início");
    expect(mensagem(agendamentoSchema, { ...base, fim: "2026-11-02T09:00:00Z" })).toBe("O fim deve ser depois do início");
    expect(mensagem(agendamentoSchema, { ...base, fim: "2026-11-03T10:00:00Z" })).toBe("O atendimento pode durar no máximo 12 horas");
  });
});

describe("consultaAgendaSchema", () => {
  it("aceita período e filtro de atendente (texto da query string)", () => {
    const r = consultaAgendaSchema.parse({ inicio: "2026-11-01", fim: "2026-12-01", atendenteId: "4" });
    expect(r.atendenteId).toBe(4);
  });

  it("exige período válido, ordenado e de até 62 dias", () => {
    expect(mensagem(consultaAgendaSchema, { fim: "2026-12-01" })).toBe("Informe o início do período");
    expect(mensagem(consultaAgendaSchema, { inicio: "2026-12-01", fim: "2026-11-01" })).toBe("O fim do período deve ser depois do início");
    expect(mensagem(consultaAgendaSchema, { inicio: "2026-01-01", fim: "2026-12-01" })).toBe("O período pode ter no máximo 62 dias");
  });
});
