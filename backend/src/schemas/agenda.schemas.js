import { z } from "zod";
import { DURACAO_MAXIMA_HORAS, PERIODO_MAXIMO_DIAS } from "../utils/agenda.js";

const data = (mensagem) =>
  z.coerce.date({ message: mensagem }).refine((d) => !Number.isNaN(d.getTime()), mensagem);

const idOpcional = (mensagem) =>
  z.coerce.number().int().positive(mensagem).nullable().optional().transform((v) => v ?? null);

export const agendamentoSchema = z
  .object({
    titulo: z.string({ message: "Informe o título" }).trim().min(2, "Informe o título").max(120, "O título deve ter no máximo 120 caracteres"),
    descricao: z
      .string()
      .trim()
      .max(500, "A descrição deve ter no máximo 500 caracteres")
      .optional()
      .nullable()
      .transform((v) => v || null),
    inicio: data("Informe o início do atendimento"),
    fim: data("Informe o fim do atendimento"),
    // Sem atendente, o agendamento é de quem está criando.
    atendenteId: z.coerce.number().int().positive("Atendente inválido").optional(),
    ticketId: idOpcional("Chamado inválido"),
  })
  .superRefine((dados, ctx) => {
    if (!(dados.inicio instanceof Date) || !(dados.fim instanceof Date)) return;
    if (dados.fim <= dados.inicio) {
      ctx.addIssue({ code: "custom", path: ["fim"], message: "O fim deve ser depois do início" });
    } else if (dados.fim - dados.inicio > DURACAO_MAXIMA_HORAS * 3_600_000) {
      ctx.addIssue({ code: "custom", path: ["fim"], message: `O atendimento pode durar no máximo ${DURACAO_MAXIMA_HORAS} horas` });
    }
  });

// Consulta da agenda (?inicio=&fim=&atendenteId=). Período obrigatório e limitado.
export const consultaAgendaSchema = z
  .object({
    inicio: data("Informe o início do período"),
    fim: data("Informe o fim do período"),
    atendenteId: z.coerce.number().int().positive("Atendente inválido").optional(),
  })
  .superRefine((dados, ctx) => {
    if (!(dados.inicio instanceof Date) || !(dados.fim instanceof Date)) return;
    if (dados.fim <= dados.inicio) {
      ctx.addIssue({ code: "custom", path: ["fim"], message: "O fim do período deve ser depois do início" });
    } else if (dados.fim - dados.inicio > PERIODO_MAXIMO_DIAS * 86_400_000) {
      ctx.addIssue({ code: "custom", path: ["fim"], message: `O período pode ter no máximo ${PERIODO_MAXIMO_DIAS} dias` });
    }
  });
