import { useEffect, useState } from "react";
import baseConhecimentoService from "../services/baseConhecimentoService";
import Botao from "./Botao";
import Modal from "./Modal";
import { Carregando } from "./Estados";

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
    <Modal titulo={artigo.titulo} onFechar={onFechar} largura="max-w-lg">
      <div className="mb-4 text-sm text-gray-700">
        {completo ? (
          <p className="whitespace-pre-line">{completo.conteudo}</p>
        ) : falhou ? (
          <>
            <p className="whitespace-pre-line">{artigo.trecho}</p>
            <p className="mt-2 text-xs text-gray-600">Não foi possível carregar o artigo completo.</p>
          </>
        ) : (
          <Carregando />
        )}
      </div>
      <div className="flex justify-end">
        <Botao type="button" variante="secundario" onClick={onFechar} autoFocus>Fechar</Botao>
      </div>
    </Modal>
  );
}
