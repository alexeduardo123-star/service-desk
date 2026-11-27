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

const idPositivo = (mensagem) => z.coerce.number({ message: mensagem }).int(mensagem).positive(mensagem);

// Parâmetros de /tickets/:id/colaboradores e /tickets/:id/colaboradores/:usuarioId.
export const ticketParamsSchema = z.object({ id: idPositivo("ID do chamado inválido") });

export const colaboradorParamsSchema = ticketParamsSchema.extend({
  usuarioId: idPositivo("ID do colaborador inválido"),
});

export const adicionarColaboradorSchema = z.object({
  usuarioId: z
    .number({ message: "Informe o colaborador" })
    .int("Colaborador inválido")
    .positive("Colaborador inválido"),
});

export const encaminharSchema = z.object({
  tecnicoId: z
    .number({ message: "Informe o atendente de destino" })
    .int("Atendente de destino inválido")
    .positive("Atendente de destino inválido"),
  motivo: z
    .string({ message: "Informe o motivo do encaminhamento" })
    .trim()
    .min(1, "Informe o motivo do encaminhamento")
    .min(5, "O motivo deve ter pelo menos 5 caracteres")
    .max(500, "O motivo deve ter no máximo 500 caracteres"),
});
