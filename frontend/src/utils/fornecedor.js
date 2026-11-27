// Máscaras e validações do cadastro de fornecedor. As regras são as mesmas do
// backend (backend/src/utils/documentos.js e schemas/fornecedor.schema.js): o
// front avisa antes de enviar e o back garante. Ao mudar uma, mude a outra.

export const apenasDigitos = (valor) => String(valor ?? "").replace(/\D/g, "");

export function formatarCnpj(valor) {
  const d = apenasDigitos(valor).slice(0, 14);
  let saida = d.slice(0, 2);
  if (d.length > 2) saida += `.${d.slice(2, 5)}`;
  if (d.length > 5) saida += `.${d.slice(5, 8)}`;
  if (d.length > 8) saida += `/${d.slice(8, 12)}`;
  if (d.length > 12) saida += `-${d.slice(12, 14)}`;
  return saida;
}

// (49) 99999-9999 para celular e (49) 3333-4444 para fixo, enquanto digita.
export function formatarTelefone(valor) {
  let d = apenasDigitos(valor);
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
  d = d.slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  const corte = d.length > 10 ? 7 : 6;
  const miolo = d.slice(2, corte);
  const fim = d.slice(corte);
  return `(${d.slice(0, 2)}) ${miolo}${fim ? `-${fim}` : ""}`;
}

export function cnpjValido(valor) {
  const cnpj = apenasDigitos(valor);
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

export function telefoneValido(valor) {
  let d = apenasDigitos(valor);
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) d = d.slice(2);
  const ddd = Number(d.slice(0, 2));
  if (ddd < 11 || ddd > 99) return false;
  if (d.length === 11) return d[2] === "9";
  if (d.length === 10) return "2345".includes(d[2]);
  return false;
}

export const emailValido = (valor) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(valor ?? "").trim());

// Devolve { campo: mensagem } só com os campos que têm problema ({} = tudo certo).
export function validarFornecedor(dados) {
  const erros = {};
  const nome = String(dados.nome ?? "").trim();
  const contato = String(dados.contato ?? "").trim();
  const email = String(dados.email ?? "").trim();
  const telefone = String(dados.telefone ?? "").trim();
  const cnpj = String(dados.cnpj ?? "").trim();

  if (nome.length < 2) erros.nome = "Informe o nome do fornecedor";
  else if (nome.length > 120) erros.nome = "O nome deve ter no máximo 120 caracteres";

  if (!cnpj) erros.cnpj = "Informe o CNPJ do fornecedor";
  else if (!cnpjValido(cnpj)) erros.cnpj = "CNPJ inválido: confira os 14 números";

  if (contato.length > 120) erros.contato = "O contato deve ter no máximo 120 caracteres";

  if (telefone && !telefoneValido(telefone)) {
    erros.telefone = "Telefone inválido: informe DDD e número, ex.: (49) 99999-9999";
  }

  if (email) {
    if (email.length > 120) erros.email = "O e-mail deve ter no máximo 120 caracteres";
    else if (!emailValido(email)) erros.email = "E-mail inválido: use o formato nome@empresa.com";
  }

  return erros;
}
