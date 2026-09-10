import { z } from "zod";

const email = z.string({ message: "email é obrigatório" }).trim().toLowerCase().email("email inválido");
const codigo = z
  .string({ message: "codigo é obrigatório" })
  .trim()
  .regex(/^\d{6}$/, "código deve ter 6 dígitos");
const senha = z.string({ message: "senha é obrigatória" }).min(6, "senha deve ter ao menos 6 caracteres");

export const registrarSchema = z.object({
  nome: z.string({ message: "nome é obrigatório" }).trim().min(2, "nome deve ter ao menos 2 caracteres"),
  email,
  senha,
});

export const loginSchema = z.object({
  email,
  senha: z.string({ message: "senha é obrigatória" }).min(1, "senha é obrigatória"),
});

export const emailSchema = z.object({ email });

export const verificarEmailSchema = z.object({ email, codigo });

export const redefinirSenhaSchema = z.object({
  email,
  codigo,
  novaSenha: senha,
});
