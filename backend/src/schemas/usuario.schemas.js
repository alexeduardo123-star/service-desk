import { z } from "zod";

// Aceita string vazia como "limpar o campo" e devolve null.
const textoOpcional = (max, nome) =>
  z
    .string({ message: `${nome} deve ser um texto` })
    .trim()
    .max(max, `${nome} deve ter no máximo ${max} caracteres`)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

export const perfilSchema = z.object({
  nome: z.string({ message: "nome é obrigatório" }).trim().min(2, "nome deve ter ao menos 2 caracteres").max(100, "nome muito longo"),
  telefone: textoOpcional(20, "telefone").refine(
    (v) => v == null || /^[\d\s()+-]{8,20}$/.test(v),
    "telefone inválido"
  ),
  cargo: textoOpcional(60, "cargo"),
});

export const alterarSenhaSchema = z
  .object({
    senhaAtual: z.string({ message: "senhaAtual é obrigatória" }).min(1, "senhaAtual é obrigatória"),
    novaSenha: z.string({ message: "novaSenha é obrigatória" }).min(6, "senha deve ter ao menos 6 caracteres"),
  })
  .refine((d) => d.senhaAtual !== d.novaSenha, { message: "a nova senha deve ser diferente da atual" });
