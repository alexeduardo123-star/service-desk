import { z } from "zod";

const data = z.coerce.date({ error: "Informe uma data válida" });

export const contratoSchema = z.object({
  titulo: z.string().trim().min(3, "Informe o título do contrato").max(150),
  fornecedorId: z.coerce.number().int().positive("Selecione um fornecedor"),
  equipamentoId: z.coerce.number().int().positive("Selecione um equipamento"),
  inicio: data,
  fim: data,
  valor: z.coerce.number().positive("O valor deve ser maior que zero"),
  status: z.enum(["ATIVO", "ENCERRADO", "SUSPENSO"]).default("ATIVO"),
  observacoes: z.string().trim().max(1000).optional().nullable().transform((v) => v || null),
}).refine((dados) => dados.fim >= dados.inicio, {
  message: "A data final deve ser igual ou posterior à data inicial",
  path: ["fim"],
});
