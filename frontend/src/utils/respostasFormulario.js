// Respostas do formulário do assunto no Novo chamado e no detalhe do chamado.

// Valores iniciais: tudo vazio e caixas desmarcadas.
export function respostasIniciais(campos = []) {
  return Object.fromEntries(campos.map((campo) => [campo.id, campo.tipo === "CHECKBOX" ? false : ""]));
}

const vazio = (valor) => valor === undefined || valor === null || String(valor).trim() === "";

// Mesmas regras de obrigatório do backend, para avisar antes de enviar.
// Devolve a mensagem do primeiro problema ou null.
export function validarRespostas(campos = [], respostas = {}) {
  for (const campo of campos) {
    if (!campo.obrigatorio) continue;
    const valor = respostas[campo.id];
    if (campo.tipo === "CHECKBOX") {
      if (valor !== true) return `Marque "${campo.rotulo}" para continuar`;
    } else if (vazio(valor)) {
      return `Preencha o campo "${campo.rotulo}"`;
    }
  }
  return null;
}

// Mostra o valor gravado de forma legível (datas em dd/mm/aaaa, Sim/Não...).
export function formatarResposta(resposta) {
  const { tipo, valor } = resposta;
  if (tipo === "CHECKBOX") return valor ? "Sim" : "Não";
  if (valor === null || valor === undefined || valor === "") return "—";
  if (tipo === "DATA" && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const [ano, mes, dia] = valor.split("-");
    return `${dia}/${mes}/${ano}`;
  }
  return String(valor);
}
