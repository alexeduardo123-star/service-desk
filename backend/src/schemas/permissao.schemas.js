import { z } from "zod";
import { CHAVES_PERMISSAO, PAPEIS } from "../utils/permissoes.js";

export const permissaoSchema = z.object({
  papel: z.enum(PAPEIS, { message: "perfil inválido" }),
  permissao: z.enum(CHAVES_PERMISSAO, { message: "permissão inválida" }),
  concedida: z.boolean({ message: "concedida deve ser verdadeiro ou falso" }),
});
