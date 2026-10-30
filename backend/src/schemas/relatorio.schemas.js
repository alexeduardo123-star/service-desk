import { z } from "zod";

// Filtros que a tela de relatórios sabe aplicar (ver utils/filtrosTicket.js).
// Chegam como texto, igual ao que vai na query string; vazio = sem filtro.
const texto = z.string().trim().max(100, "filtro muito longo").optional();

export const filtrosRelatorioSchema = z.object({
  de: texto,
  ate: texto,
  status: texto,
  categoriaId: texto,
  prioridadeId: texto,
  tecnicoId: texto,
  q: texto,
});

const campos = {
  nome: z.string({ message: "nome é obrigatório" }).trim().min(3, "nome deve ter ao menos 3 caracteres").max(80, "nome muito longo"),
  descricao: z
    .string()
    .trim()
    .max(255, "descrição muito longa")
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
};

export const relatorioSalvoSchema = z.object({
  ...campos,
  filtros: filtrosRelatorioSchema.default({}),
});

// Na edição todos os campos são opcionais (dá para só renomear, por exemplo).
// Aqui "filtros" NÃO tem default: se viesse {} por padrão, renomear um
// relatório apagaria os filtros que ele já tinha salvos.
export const relatorioSalvoAtualizacaoSchema = z
  .object({ ...campos, filtros: filtrosRelatorioSchema })
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: "informe ao menos um campo para atualizar" });
