import { z } from "zod";

export const alterarStatusSchema = z.object({
  status: z.enum(["ABERTO", "EM_ANDAMENTO", "FECHADO"], { message: "status inválido" }),
});

export const atribuirSchema = z.object({
  tecnicoId: z.number({ message: "tecnicoId é obrigatório" }).int().positive("tecnicoId inválido"),
});
