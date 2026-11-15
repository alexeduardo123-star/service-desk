import { z } from "zod";

const textoOpcional = z
  .string()
  .trim()
  .max(500, "A descrição deve ter no máximo 500 caracteres")
  .optional()
  .nullable()
  .transform((valor) => valor || null);

export const servicoSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do serviço").max(120),
  descricao: textoOpcional,
  ativo: z.boolean().optional().default(true),
});
