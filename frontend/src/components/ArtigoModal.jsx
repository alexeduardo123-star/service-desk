import { useEffect, useState } from "react";
import baseConhecimentoService from "../services/baseConhecimentoService";
import Botao from "./Botao";

// Mostra um artigo da base de conhecimento por cima da tela atual (usado nas
// sugestões do novo chamado, para a pessoa ler sem perder o que já preencheu).
// `artigo` é a sugestão ({ id, titulo, trecho }); o conteúdo completo é buscado aqui.
export default function ArtigoModal({ artigo, onFechar }) {
  const [completo, setCompleto] = useState(null);
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    let ativo = true;
    baseConhecimentoService
      .buscar(artigo.id)
      .then((dados) => ativo && setCompleto(dados))
      .catch(() => ativo && setFalhou(true));
    return () => {
      ativo = false;
    };
  }, [artigo.id]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onKeyDown={(e) => e.key === "Escape" && onFechar()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-artigo"
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-lg bg-white p-5 shadow-lg"
      >
        <h2 id="titulo-artigo" className="mb-3 text-lg font-semibold text-gray-900">{artigo.titulo}</h2>
        <div className="mb-4 overflow-y-auto text-sm text-gray-700">
          {completo ? (
            <p className="whitespace-pre-line">{completo.conteudo}</p>
          ) : falhou ? (
            <>
              <p className="whitespace-pre-line">{artigo.trecho}</p>
              <p className="mt-2 text-xs text-gray-500">Não foi possível carregar o artigo completo.</p>
            </>
          ) : (
            <p className="text-gray-500">Carregando…</p>
          )}
        </div>
        <div className="flex justify-end">
          <Botao type="button" variante="secundario" onClick={onFechar} autoFocus>Fechar</Botao>
        </div>
      </div>
    </div>
  );
}
