// Exportação CSV pensada para abrir direto no Excel em português: separador
// ";" e BOM UTF-8 (senão os acentos quebram).
const SEPARADOR = ";";

// Células que começam com = + - @ viram fórmula no Excel; o apóstrofo evita
// a execução ("CSV injection"), já que o título dos chamados é digitado por usuários.
function escapar(valor) {
  if (valor === null || valor === undefined) return "";
  let texto = String(valor);
  if (/^[=+\-@]/.test(texto)) texto = `'${texto}`;
  if (/[";\n\r]/.test(texto)) texto = `"${texto.replace(/"/g, '""')}"`;
  return texto;
}

// colunas: [{ rotulo, valor: (linha) => ... }]
export function gerarCsv(colunas, linhas) {
  const cabecalho = colunas.map((c) => escapar(c.rotulo)).join(SEPARADOR);
  const corpo = linhas.map((linha) => colunas.map((c) => escapar(c.valor(linha))).join(SEPARADOR));
  return "﻿" + [cabecalho, ...corpo].join("\r\n");
}

export function baixarCsv(nomeArquivo, conteudo) {
  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  link.click();
  URL.revokeObjectURL(url);
}
