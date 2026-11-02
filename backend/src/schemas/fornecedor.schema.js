import { z } from "zod";

function cnpjValido(valor) {
  const cnpj = valor.replace(/\D/g, "");

  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) {
    return false;
  }

  const calcularDigito = (base, pesos) => {
    const soma = [...base].reduce(
      (total, digito, indice) => total + Number(digito) * pesos[indice],
      0
    );

    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const primeiro = calcularDigito(cnpj.slice(0, 12), [
    5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2,
  ]);

  const segundo = calcularDigito(cnpj.slice(0, 12) + primeiro, [
    6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2,
  ]);

  return cnpj.endsWith(`${primeiro}${segundo}`);
}

const textoOpcional = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((valor) => valor || null);

export const fornecedorSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do fornecedor").max(120),

  cnpj: z
    .string()
    .trim()
    .refine(cnpjValido, "Informe um CNPJ válido")
    .transform((valor) => valor.replace(/\D/g, "")),

  contato: textoOpcional,
  telefone: textoOpcional,

  email: z
    .union([
      z.string().trim().email("E-mail inválido"),
      z.literal(""),
      z.null(),
    ])
    .optional()
    .transform((valor) => valor || null),

  ativo: z.boolean().optional().default(true),
});