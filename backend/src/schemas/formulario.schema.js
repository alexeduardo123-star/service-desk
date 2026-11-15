import { z } from "zod";

export const TIPOS_CAMPO = ["TEXTO", "TEXTO_LONGO", "NUMERO", "DATA", "SELECAO", "CHECKBOX"];

const textoOpcional = z
  .string()
  .trim()
  .max(500, "A descrição deve ter no máximo 500 caracteres")
  .optional()
  .nullable()
  .transform((valor) => valor || null);

const campoSchema = z
  .object({
    rotulo: z.string().trim().min(1, "Informe o rótulo de todos os campos").max(120),
    tipo: z.enum(TIPOS_CAMPO, { error: "Tipo de campo inválido" }),
    obrigatorio: z.boolean().optional().default(false),
    opcoes: z.array(z.string().trim().max(120)).optional().default([]),
  })
  // Só campos de seleção guardam opções; remove vazias e repetidas.
  .transform((campo) => ({
    ...campo,
    opcoes: campo.tipo === "SELECAO" ? [...new Set(campo.opcoes.filter(Boolean))] : [],
  }))
  .refine((campo) => campo.tipo !== "SELECAO" || campo.opcoes.length >= 2, {
    message: "Campos de seleção precisam de pelo menos 2 opções",
    path: ["opcoes"],
  });

export const formularioSchema = z
  .object({
    nome: z.string().trim().min(2, "Informe o nome do formulário").max(120),
    descricao: textoOpcional,
    ativo: z.boolean().optional().default(true),
    campos: z
      .array(campoSchema)
      .min(1, "Adicione pelo menos um campo ao formulário")
      .max(50, "O formulário pode ter no máximo 50 campos"),
  })
  .refine(
    (dados) => {
      const rotulos = dados.campos.map((campo) => campo.rotulo.toLowerCase());
      return new Set(rotulos).size === rotulos.length;
    },
    { message: "Existem campos com o mesmo rótulo", path: ["campos"] }
  )
  // A ordem dos campos é a ordem em que chegaram.
  .transform((dados) => ({
    ...dados,
    campos: dados.campos.map((campo, indice) => ({ ...campo, ordem: indice })),
  }));
