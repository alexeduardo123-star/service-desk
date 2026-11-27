import { z } from "zod";

// Query strings chegam como texto; "" (campo limpo na tela) vale como ausente.
const vazioComoAusente = (schema) => z.preprocess((v) => (v === "" ? undefined : v), schema);

const categoriaOpcional = vazioComoAusente(
  z.coerce.number({ message: "Categoria inválida" }).int("Categoria inválida").positive("Categoria inválida").optional()
);

// GET /base-conhecimento?q=&categoriaId=
export const listarArtigosQuerySchema = z.object({
  q: vazioComoAusente(
    z.string({ message: "Busca inválida" }).trim().max(100, "A busca deve ter no máximo 100 caracteres").optional()
  ),
  categoriaId: categoriaOpcional,
});

// GET /base-conhecimento/sugestoes?texto=&categoriaId=
export const sugestoesQuerySchema = z.object({
  texto: z
    .string({ message: "Texto inválido" })
    .max(5000, "O texto deve ter no máximo 5000 caracteres")
    .optional()
    .default(""),
  categoriaId: categoriaOpcional,
});
