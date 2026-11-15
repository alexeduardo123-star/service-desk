import { z } from "zod";

const textoOpcional = z
  .string()
  .trim()
  .max(500, "A descrição deve ter no máximo 500 caracteres")
  .optional()
  .nullable()
  .transform((valor) => valor || null);

export const assuntoSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do assunto").max(120),
  descricao: textoOpcional,
  servicoId: z.coerce.number().int().positive("Selecione um serviço"),
  // O formulário é opcional: um assunto pode não exigir dados extras.
  formularioId: z.coerce
    .number()
    .int()
    .positive("Selecione um formulário válido")
    .nullable()
    .optional()
    .transform((valor) => valor ?? null),
  ativo: z.boolean().optional().default(true),
});
