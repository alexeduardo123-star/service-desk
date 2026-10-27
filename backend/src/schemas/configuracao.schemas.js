import { z } from "zod";

// Fusos aceitos na tela de configurações. Mantido curto de propósito: são os
// fusos do Brasil + UTC, suficiente para o escopo do projeto.
export const FUSOS_HORARIOS = [
  "America/Sao_Paulo",
  "America/Manaus",
  "America/Belem",
  "America/Fortaleza",
  "America/Cuiaba",
  "America/Rio_Branco",
  "America/Noronha",
  "UTC",
];

export const ITENS_POR_PAGINA = [5, 10, 20, 50];

const booleano = (nome) => z.boolean({ message: `${nome} deve ser verdadeiro ou falso` });

export const configuracaoSchema = z
  .object({
    itensPorPagina: z
      .number({ message: "itensPorPagina deve ser um número" })
      .refine((n) => ITENS_POR_PAGINA.includes(n), `itensPorPagina deve ser um de: ${ITENS_POR_PAGINA.join(", ")}`),
    fusoHorario: z
      .string({ message: "fusoHorario deve ser um texto" })
      .refine((f) => FUSOS_HORARIOS.includes(f), "fuso horário não suportado"),
    notificarEmail: booleano("notificarEmail"),
    notificarNovoTicket: booleano("notificarNovoTicket"),
    notificarAtribuicao: booleano("notificarAtribuicao"),
    notificarStatus: booleano("notificarStatus"),
    notificarComentario: booleano("notificarComentario"),
  })
  .partial();
