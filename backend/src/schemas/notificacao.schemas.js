import { z } from "zod";

export const marcarLidaSchema = z.object({
  lida: z.boolean({ message: "lida deve ser verdadeiro ou falso" }).default(true),
});

// Notificação manual (comunicado) enviada por um ADMIN.
export const criarNotificacaoSchema = z.object({
  titulo: z.string({ message: "título é obrigatório" }).trim().min(3, "título deve ter ao menos 3 caracteres").max(120, "título muito longo"),
  mensagem: z.string({ message: "mensagem é obrigatória" }).trim().min(3, "mensagem deve ter ao menos 3 caracteres").max(1000, "mensagem muito longa"),
  destino: z.discriminatedUnion(
    "tipo",
    [
      z.object({ tipo: z.literal("TODOS") }),
      z.object({ tipo: z.literal("PAPEL"), papel: z.enum(["ADMIN", "TECNICO", "SOLICITANTE"], { message: "papel inválido" }) }),
      z.object({ tipo: z.literal("USUARIO"), usuarioId: z.number({ message: "usuarioId é obrigatório" }).int().positive() }),
    ],
    { message: "destino inválido" }
  ),
  ticketId: z.number().int().positive().nullable().optional(),
});
