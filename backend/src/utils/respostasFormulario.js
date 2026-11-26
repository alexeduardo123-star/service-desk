// Valida as respostas do formulário do assunto na hora de abrir o chamado.
//
// campos: campos do formulário ([{ id, rotulo, tipo, obrigatorio, opcoes }]).
// respostas: objeto { [campoId]: valor } vindo da tela.
// Devolve { erro } com a mensagem do primeiro problema, ou { respostas } com a
// lista pronta para gravar: [{ campoId, rotulo, tipo, valor }].

const LIMITE_TEXTO = 500;
const LIMITE_TEXTO_LONGO = 2000;

function vazio(valor) {
  return valor === undefined || valor === null || (typeof valor === "string" && valor.trim() === "");
}

function dataValida(valor) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const d = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === valor;
}

function normalizar(campo, bruto) {
  const rotulo = campo.rotulo;

  if (campo.tipo === "CHECKBOX") {
    if (bruto !== undefined && typeof bruto !== "boolean") return { erro: `Resposta inválida em "${rotulo}"` };
    const marcado = bruto === true;
    if (campo.obrigatorio && !marcado) return { erro: `Marque "${rotulo}" para continuar` };
    return { valor: marcado };
  }

  if (vazio(bruto)) {
    return campo.obrigatorio ? { erro: `Preencha o campo "${rotulo}"` } : { valor: null };
  }

  if (campo.tipo === "NUMERO") {
    const numero = typeof bruto === "number" ? bruto : Number(String(bruto).replace(",", "."));
    if (!Number.isFinite(numero)) return { erro: `"${rotulo}" deve ser um número` };
    return { valor: numero };
  }

  const texto = String(bruto).trim();

  if (campo.tipo === "DATA") {
    return dataValida(texto) ? { valor: texto } : { erro: `"${rotulo}" deve ser uma data válida` };
  }

  if (campo.tipo === "SELECAO") {
    return (campo.opcoes ?? []).includes(texto) ? { valor: texto } : { erro: `Escolha uma opção válida em "${rotulo}"` };
  }

  const limite = campo.tipo === "TEXTO_LONGO" ? LIMITE_TEXTO_LONGO : LIMITE_TEXTO;
  if (texto.length > limite) return { erro: `"${rotulo}" deve ter no máximo ${limite} caracteres` };
  return { valor: texto };
}

export function validarRespostas(campos = [], respostas = {}) {
  if (respostas === null || typeof respostas !== "object" || Array.isArray(respostas)) {
    return { erro: "Respostas do formulário inválidas" };
  }

  const resultado = [];
  for (const campo of campos) {
    const { erro, valor } = normalizar(campo, respostas[campo.id]);
    if (erro) return { erro };
    resultado.push({ campoId: campo.id, rotulo: campo.rotulo, tipo: campo.tipo, valor });
  }
  return { respostas: resultado };
}
