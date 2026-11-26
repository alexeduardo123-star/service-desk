import { z } from "zod";

// SUSPENSO fica de fora de propósito: suspender exige motivo, então só entra
// pela rota própria (PATCH /tickets/:id/suspender).
export const alterarStatusSchema = z.object({
  status: z.enum(["ABERTO", "EM_ANDAMENTO", "AGUARDANDO_USUARIO", "FECHADO"], { message: "status inválido" }),
});

export const suspenderSchema = z.object({
  motivo: z
    .string({ message: "Informe o motivo da suspensão" })
    .trim()
    .min(1, "Informe o motivo da suspensão")
    .max(1000, "O motivo deve ter no máximo 1000 caracteres"),
});

export const rejeitarSchema = z.object({
  motivo: z
    .string({ message: "Informe o motivo da rejeição" })
    .trim()
    .min(1, "Informe o motivo da rejeição")
    .max(1000, "O motivo deve ter no máximo 1000 caracteres"),
});

export const atribuirSchema = z.object({
  tecnicoId: z.number({ message: "tecnicoId é obrigatório" }).int().positive("tecnicoId inválido"),
});
