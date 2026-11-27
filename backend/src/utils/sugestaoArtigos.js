// Sugestão de artigos da base de conhecimento a partir do texto do chamado.
// Tudo aqui é puro: o controller busca os candidatos no banco e usa estas
// funções para escolher as palavras e ordenar o resultado.

export const LIMITE_SUGESTOES = 5;
// Teto de palavras usadas na busca, para o OR do banco não crescer sem limite
// quando a pessoa cola um texto enorme na descrição.
export const MAX_PALAVRAS = 12;

export const PESO_TITULO = 3;
export const PESO_CONTEUDO = 1;
export const BONUS_CATEGORIA = 2;

// Palavras comuns do português que não ajudam a achar artigo. Já sem acento e
// só com 3+ letras (as de até 2 letras são descartadas antes).
const STOPWORDS = new Set(
  (
    "ali aqui assim ate antes apos aquela aquele aquilo cada coisa com como contra das dela dele deles " +
    "depois desde dessa desse desta deste dia dos ela elas ele eles entao entre essa essas esse esses esta " +
    "estao estas este estes estou estava fazer favor foi for fui hoje isso isto mais mas meu meus minha " +
    "minhas muito muita nao nem nessa nesse nesta neste nos nossa nosso num numa obrigado obrigada onde " +
    "ola outra outro para pela pelas pelo pelos pois porque por pouco quais qual quando que quem sao " +
    "seja sem sempre ser seu seus sido sim sobre sua suas tambem tem tenho ter toda todas todo todos " +
    "uma umas uns vai voce voces bom boa dia tarde noite consigo preciso estou"
  ).split(/\s+/)
);

// Minúsculas e sem acento ("Impressão" -> "impressao").
export function normalizar(texto = "") {
  return String(texto).normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

// Palavras relevantes do texto, sem repetição, na ordem em que aparecem.
export function extrairPalavras(texto = "", maximo = MAX_PALAVRAS) {
  const vistas = new Set();
  for (const palavra of normalizar(texto).split(/[^\p{L}\p{N}]+/u)) {
    if (palavra.length <= 2 || STOPWORDS.has(palavra) || vistas.has(palavra)) continue;
    vistas.add(palavra);
    if (vistas.size >= maximo) break;
  }
  return [...vistas];
}

// Formas a procurar no banco: a palavra sem acento e, se for diferente, como a
// pessoa digitou (o contains "insensitive" ignora maiúsculas, mas não acentos).
export function termosDeBusca(texto = "", maximo = MAX_PALAVRAS) {
  const palavras = extrairPalavras(texto, maximo);
  const digitadas = new Map();
  for (const original of String(texto).toLowerCase().split(/[^\p{L}\p{N}]+/u)) {
    const chave = normalizar(original);
    if (palavras.includes(chave) && !digitadas.has(chave)) digitadas.set(chave, original);
  }
  const termos = new Set(palavras);
  for (const original of digitadas.values()) termos.add(original);
  return [...termos];
}

// Cada palavra achada no título vale PESO_TITULO e no conteúdo PESO_CONTEUDO.
// A mesma categoria do chamado soma BONUS_CATEGORIA, mas só para artigo que já
// bateu alguma palavra (categoria sozinha não torna o artigo relevante).
export function pontuarArtigo(artigo, palavras, categoriaId = null) {
  const titulo = normalizar(artigo.titulo);
  const conteudo = normalizar(artigo.conteudo);
  let pontos = 0;
  for (const palavra of palavras) {
    if (titulo.includes(palavra)) pontos += PESO_TITULO;
    if (conteudo.includes(palavra)) pontos += PESO_CONTEUDO;
  }
  if (pontos > 0 && categoriaId != null && artigo.categoriaId === categoriaId) pontos += BONUS_CATEGORIA;
  return pontos;
}

// Mais pontos primeiro; empate fica com o artigo mais recente.
export function ordenarSugestoes(artigos, palavras, categoriaId = null, limite = LIMITE_SUGESTOES) {
  return artigos
    .map((artigo) => ({ artigo, pontos: pontuarArtigo(artigo, palavras, categoriaId) }))
    .filter((s) => s.pontos > 0)
    .sort((a, b) => b.pontos - a.pontos || new Date(b.artigo.createdAt) - new Date(a.artigo.createdAt))
    .slice(0, limite)
    .map((s) => s.artigo);
}

// Trecho do conteúdo para mostrar na sugestão: em volta da primeira palavra
// achada, ou o começo do texto. Normaliza em NFC para que as posições do texto
// sem acento batam com as do original.
export function gerarTrecho(conteudo = "", palavras = [], tamanho = 160) {
  const texto = String(conteudo).normalize("NFC").replace(/\s+/g, " ").trim();
  if (texto.length <= tamanho) return texto;

  const semAcento = normalizar(texto);
  const posicoes = palavras.map((p) => semAcento.indexOf(p)).filter((i) => i >= 0);
  const achou = posicoes.length > 0 && semAcento.length === texto.length;
  const inicio = achou ? Math.max(0, Math.min(Math.min(...posicoes) - 40, texto.length - tamanho)) : 0;
  const fim = Math.min(texto.length, inicio + tamanho);
  return `${inicio > 0 ? "…" : ""}${texto.slice(inicio, fim).trim()}${fim < texto.length ? "…" : ""}`;
}
