// Validações de documentos e contatos brasileiros usadas nos cadastros.
// O frontend tem as mesmas regras em frontend/src/utils/fornecedor.js — ao
// mudar uma, mude a outra.

export const apenasDigitos = (valor) => String(valor ?? "").replace(/\D/g, "");

export function cnpjValido(valor) {
  const cnpj = apenasDigitos(valor);

  // 14 dígitos e não pode ser sequência repetida (00000000000000, 11111111111111...).
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

  const digito = (base, pesos) => {
    const soma = [...base].reduce((total, d, i) => total + Number(d) * pesos[i], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const primeiro = digito(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const segundo = digito(cnpj.slice(0, 12) + primeiro, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return cnpj.endsWith(`${primeiro}${segundo}`);
}

// Telefone brasileiro só com dígitos e sem o 55: DDD (11 a 99) + número.
// Celular: 11 dígitos, começando com 9 depois do DDD. Fixo: 10 dígitos,
// começando de 2 a 5 depois do DDD. Devolve null quando não é válido.
export function normalizarTelefone(valor) {
  let digitos = apenasDigitos(valor);
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith("55")) digitos = digitos.slice(2);

  const ddd = Number(digitos.slice(0, 2));
  if (ddd < 11 || ddd > 99) return null;
  if (digitos.length === 11 && digitos[2] === "9") return digitos;
  if (digitos.length === 10 && "2345".includes(digitos[2])) return digitos;
  return null;
}

export const telefoneValido = (valor) => normalizarTelefone(valor) !== null;
