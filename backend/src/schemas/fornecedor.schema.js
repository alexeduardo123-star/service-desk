import { z } from "zod";
import { apenasDigitos, cnpjValido, normalizarTelefone } from "../utils/documentos.js";

const textoOpcional = (max, mensagemMax) =>
  z
    .string()
    .trim()
    .max(max, mensagemMax)
    .optional()
    .nullable()
    .transform((valor) => valor || null);

export const fornecedorSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do fornecedor").max(120, "O nome deve ter no máximo 120 caracteres"),

  cnpj: z
    .string({ message: "Informe o CNPJ do fornecedor" })
    .trim()
    .min(1, "Informe o CNPJ do fornecedor")
    .refine(cnpjValido, "CNPJ inválido: confira os 14 números")
    .transform(apenasDigitos),

  contato: textoOpcional(120, "O contato deve ter no máximo 120 caracteres"),

  // Opcional, mas se vier tem que ser um telefone brasileiro com DDD.
  // Guarda só os dígitos (sem 55), como o CNPJ.
  telefone: z
    .union([z.string().trim(), z.null()])
    .optional()
    .transform((valor, ctx) => {
      if (!valor) return null;
      const normalizado = normalizarTelefone(valor);
      if (!normalizado) {
        ctx.addIssue({ code: "custom", message: "Telefone inválido: informe DDD e número, ex.: (49) 99999-9999" });
        return z.NEVER;
      }
      return normalizado;
    }),

  email: z
    .union([z.string().trim(), z.null()])
    .optional()
    .transform((valor, ctx) => {
      if (!valor) return null;
      if (valor.length > 120) {
        ctx.addIssue({ code: "custom", message: "O e-mail deve ter no máximo 120 caracteres" });
        return z.NEVER;
      }
      if (!z.string().email().safeParse(valor).success) {
        ctx.addIssue({ code: "custom", message: "E-mail inválido: use o formato nome@empresa.com" });
        return z.NEVER;
      }
      return valor.toLowerCase();
    }),

  ativo: z.boolean().optional().default(true),
});
