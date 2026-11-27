import { useEffect } from "react";
import { NOME_APP } from "../constants/marca";

// Título da aba do navegador: "Chamados — FlowDesk". Sem título, só o nome do app.
export function tituloDaAba(titulo) {
  return titulo ? `${titulo} — ${NOME_APP}` : NOME_APP;
}

export function useTituloPagina(titulo) {
  useEffect(() => {
    document.title = tituloDaAba(titulo);
  }, [titulo]);
}
