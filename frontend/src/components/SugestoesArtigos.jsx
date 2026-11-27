import { useEffect, useState } from "react";
import baseConhecimentoService from "../services/baseConhecimentoService";
import { useDebounce } from "../hooks/useDebounce";
import ArtigoModal from "./ArtigoModal";

export const ATRASO_SUGESTOES = 400;
const MINIMO_CARACTERES = 3;

// Bloco "Isso pode resolver seu problema" do novo chamado. É só uma ajuda: não
// participa do envio do formulário e qualquer erro na busca é ignorado em
// silêncio (o bloco simplesmente não aparece).
// - textoDigitado: título + descrição; só busca depois de uma pausa na digitação.
// - textoExtra: o que vem de escolhas (ex.: nome do assunto); busca na hora.
export default function SugestoesArtigos({ textoDigitado = "", textoExtra = "", categoriaId = "" }) {
  const digitado = useDebounce(textoDigitado.trim(), ATRASO_SUGESTOES);
  const texto = [digitado, textoExtra.trim()].filter(Boolean).join(" ");
  const temTexto = texto.length >= MINIMO_CARACTERES;
  const [artigos, setArtigos] = useState([]);
  const [aberto, setAberto] = useState(null);

  useEffect(() => {
    if (!temTexto) return;
    // Só a resposta da busca mais recente conta; as anteriores são descartadas.
    let ativo = true;
    baseConhecimentoService
      .sugestoes({ texto, categoriaId })
      .then((lista) => ativo && setArtigos(Array.isArray(lista) ? lista.slice(0, 5) : []))
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, [texto, categoriaId, temTexto]);

  const visiveis = temTexto ? artigos : [];
  if (visiveis.length === 0) return null;

  return (
    <section aria-labelledby="titulo-sugestoes" className="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <h2 id="titulo-sugestoes" className="mb-2 text-sm font-semibold text-blue-900">Isso pode resolver seu problema</h2>
      <ul className="flex flex-col gap-2">
        {visiveis.map((artigo) => (
          <li key={artigo.id}>
            <button
              type="button"
              className="w-full rounded-md bg-white p-2 text-left hover:bg-blue-100"
              onClick={() => setAberto(artigo)}
            >
              <span className="block text-sm font-medium text-blue-800">{artigo.titulo}</span>
              {artigo.trecho && <span className="block text-xs text-gray-600">{artigo.trecho}</span>}
            </button>
          </li>
        ))}
      </ul>
      {/* O Modal vai para o <body> por portal: não fica dentro do <form> do chamado. */}
      {aberto && <ArtigoModal artigo={aberto} onFechar={() => setAberto(null)} />}
    </section>
  );
}
