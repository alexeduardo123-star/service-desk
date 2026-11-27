import { describe, it, expect } from "vitest";
import {
  BONUS_CATEGORIA,
  PESO_CONTEUDO,
  PESO_TITULO,
  extrairPalavras,
  gerarTrecho,
  normalizar,
  ordenarSugestoes,
  pontuarArtigo,
  termosDeBusca,
} from "./sugestaoArtigos.js";

const artigo = (id, titulo, conteudo, extra = {}) => ({
  id,
  titulo,
  conteudo,
  categoriaId: null,
  createdAt: "2026-11-01T10:00:00Z",
  ...extra,
});

describe("normalizar", () => {
  it("deixa minúsculo e tira acentos e cedilha", () => {
    expect(normalizar("Impressão NÃO Funciona à Tarde, Configuração")).toBe("impressao nao funciona a tarde, configuracao");
  });

  it("aceita valores vazios", () => {
    expect(normalizar()).toBe("");
    expect(normalizar(null)).toBe("null");
  });
});

describe("extrairPalavras", () => {
  it("ignora palavras de até 2 letras, stopwords e repetições", () => {
    expect(extrairPalavras("A impressora do RH não está imprimindo, a impressora trava")).toEqual([
      "impressora",
      "imprimindo",
      "trava",
    ]);
  });

  it("quebra em pontuação e mantém números", () => {
    expect(extrairPalavras("VPN/rede: erro 809 no Windows-11")).toEqual(["vpn", "rede", "erro", "809", "windows"]);
  });

  it("texto vazio ou só com stopwords não gera palavras", () => {
    expect(extrairPalavras("")).toEqual([]);
    expect(extrairPalavras("Olá, bom dia, por favor")).toEqual([]);
  });

  it("respeita o máximo de palavras", () => {
    expect(extrairPalavras("alfa beta gama delta epsilon", 3)).toEqual(["alfa", "beta", "gama"]);
  });
});

describe("termosDeBusca", () => {
  it("inclui a forma sem acento e a forma digitada", () => {
    expect(termosDeBusca("Impressão falhando")).toEqual(["impressao", "falhando", "impressão"]);
  });

  it("não duplica quando a palavra não tem acento", () => {
    expect(termosDeBusca("VPN caiu")).toEqual(["vpn", "caiu"]);
  });
});

describe("pontuarArtigo", () => {
  const vpn = artigo(1, "Como configurar a VPN", "Abra o cliente de VPN e informe o usuário da rede.", { categoriaId: 3 });

  it("título vale mais que conteúdo", () => {
    expect(pontuarArtigo(vpn, ["vpn"])).toBe(PESO_TITULO + PESO_CONTEUDO);
    expect(pontuarArtigo(vpn, ["rede"])).toBe(PESO_CONTEUDO);
    expect(pontuarArtigo(vpn, ["configurar"])).toBe(PESO_TITULO);
  });

  it("compara sem acento e sem diferenciar maiúsculas", () => {
    const impressora = artigo(2, "IMPRESSÃO em rede", "...");
    expect(pontuarArtigo(impressora, ["impressao"])).toBe(PESO_TITULO);
  });

  it("mesma categoria soma pontos só se alguma palavra bateu", () => {
    expect(pontuarArtigo(vpn, ["rede"], 3)).toBe(PESO_CONTEUDO + BONUS_CATEGORIA);
    expect(pontuarArtigo(vpn, ["rede"], 4)).toBe(PESO_CONTEUDO);
    expect(pontuarArtigo(vpn, ["impressora"], 3)).toBe(0);
  });
});

describe("ordenarSugestoes", () => {
  it("ordena por pontos, descarta quem não bateu nada e desempata pelo mais recente", () => {
    const artigos = [
      artigo(1, "Senha do e-mail", "Troque a senha no portal."),
      artigo(2, "Impressora sem papel", "Coloque papel na bandeja."),
      artigo(3, "Rede lenta", "Reinicie o roteador. A impressora também usa a rede.", { createdAt: "2026-11-02T10:00:00Z" }),
      artigo(4, "Rede Wi-Fi", "A impressora da rede precisa de IP fixo.", { createdAt: "2026-11-05T10:00:00Z" }),
    ];

    const ordem = ordenarSugestoes(artigos, ["impressora", "rede"]).map((a) => a.id);

    // 3 e 4 empatam (título "rede" + conteúdo), o 4 é mais novo; o 2 só bate no título.
    expect(ordem).toEqual([4, 3, 2]);
  });

  it("a categoria do chamado desempata a favor do artigo dela", () => {
    const artigos = [artigo(1, "VPN", "x", { categoriaId: 1 }), artigo(2, "VPN", "x", { categoriaId: 2 })];
    expect(ordenarSugestoes(artigos, ["vpn"], 2).map((a) => a.id)).toEqual([2, 1]);
  });

  it("devolve no máximo 5", () => {
    const artigos = Array.from({ length: 8 }, (_, i) => artigo(i + 1, `VPN ${i}`, "vpn"));
    expect(ordenarSugestoes(artigos, ["vpn"])).toHaveLength(5);
  });

  it("sem palavras não sugere nada", () => {
    expect(ordenarSugestoes([artigo(1, "VPN", "vpn", { categoriaId: 1 })], [], 1)).toEqual([]);
  });
});

describe("gerarTrecho", () => {
  it("texto curto volta inteiro, com espaços normalizados", () => {
    expect(gerarTrecho("Reinicie   o\nroteador.", ["roteador"])).toBe("Reinicie o roteador.");
  });

  it("texto longo mostra a região da primeira palavra achada", () => {
    const conteudo = `${"Introdução longa sobre o setor. ".repeat(10)}Para a impressora, reinicie o spooler.`;
    const trecho = gerarTrecho(conteudo, ["impressora"], 80);
    expect(trecho.startsWith("…")).toBe(true);
    expect(trecho).toContain("impressora");
    expect(trecho.length).toBeLessThanOrEqual(82);
  });

  it("sem palavra achada, mostra o começo", () => {
    const trecho = gerarTrecho("a".repeat(300), ["vpn"], 50);
    expect(trecho).toBe(`${"a".repeat(50)}…`);
  });
});
