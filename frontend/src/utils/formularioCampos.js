// Regras do editor de formulários (tela de Formulários), separadas da view
// para poderem ser testadas sem renderizar nada.

export const TIPOS_CAMPO = [
  { value: "TEXTO", label: "Texto curto" },
  { value: "TEXTO_LONGO", label: "Texto longo" },
  { value: "NUMERO", label: "Número" },
  { value: "DATA", label: "Data" },
  { value: "SELECAO", label: "Lista de opções" },
  { value: "CHECKBOX", label: "Sim/Não (caixa de seleção)" },
];

// Chave local só para o React identificar cada campo enquanto é editado.
let sequencia = 0;
const novaChave = () => `campo-${++sequencia}`;

export function novoCampo() {
  return { chave: novaChave(), rotulo: "", tipo: "TEXTO", obrigatorio: false, opcoesTexto: "" };
}

export function formularioVazio() {
  return { id: null, nome: "", descricao: "", ativo: true, campos: [novoCampo()] };
}

export function formularioParaEdicao(formulario) {
  return {
    id: formulario.id,
    nome: formulario.nome,
    descricao: formulario.descricao ?? "",
    ativo: formulario.ativo,
    campos: (formulario.campos ?? []).map((campo) => ({
      chave: novaChave(),
      rotulo: campo.rotulo,
      tipo: campo.tipo,
      obrigatorio: campo.obrigatorio,
      opcoesTexto: (campo.opcoes ?? []).join("\n"),
    })),
  };
}

// As opções da lista são digitadas uma por linha.
export function opcoesDoTexto(texto) {
  const opcoes = String(texto ?? "")
    .split("\n")
    .map((opcao) => opcao.trim())
    .filter(Boolean);
  return [...new Set(opcoes)];
}

export function montarPayload(form) {
  return {
    nome: form.nome.trim(),
    descricao: form.descricao.trim() || null,
    ativo: form.ativo,
    campos: form.campos.map((campo) => ({
      rotulo: campo.rotulo.trim(),
      tipo: campo.tipo,
      obrigatorio: campo.obrigatorio,
      opcoes: campo.tipo === "SELECAO" ? opcoesDoTexto(campo.opcoesTexto) : [],
    })),
  };
}

// Mesmas regras do backend, para avisar antes de enviar. Retorna a mensagem
// do primeiro problema encontrado ou null se estiver tudo certo.
export function validarFormulario(form) {
  if (form.nome.trim().length < 2) return "Informe o nome do formulário";
  if (form.campos.length === 0) return "Adicione pelo menos um campo ao formulário";

  const rotulos = [];
  for (const campo of form.campos) {
    const rotulo = campo.rotulo.trim();
    if (!rotulo) return "Informe o rótulo de todos os campos";
    if (campo.tipo === "SELECAO" && opcoesDoTexto(campo.opcoesTexto).length < 2) {
      return `O campo "${rotulo}" precisa de pelo menos 2 opções`;
    }
    rotulos.push(rotulo.toLowerCase());
  }

  if (new Set(rotulos).size !== rotulos.length) return "Existem campos com o mesmo rótulo";
  return null;
}

export function moverCampo(campos, indice, deslocamento) {
  const destino = indice + deslocamento;
  if (destino < 0 || destino >= campos.length) return campos;

  const copia = [...campos];
  [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
  return copia;
}
